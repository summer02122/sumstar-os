# Handoff Report: Iteration 3 Bug Fixes

## 1. Observation

- **Destructive Data Loss**: In `src/store/agentStore.ts` (lines 145-162), there is a `// --- TEMPORARY CLEANUP FOR NEW ORG STRUCTURE ---` block. It actively filters `agentsData` and `skillsData` and runs `supabase.from('agents').delete()` on any record not matching the defaults (`DEFAULT_AGENTS`, `DEFAULT_SKILLS`).
- **Subscription Memory Leak**: In `src/store/agentStore.ts` (lines 222-232), `supabase.channel('public:tasks')...subscribe()` is called inside the `initialize` method. Since `initialize(true)` is invoked on every database change, it repeatedly creates new channel listeners.
- **Frontend Realtime Sync Race Condition**: In `src/store/agentStore.ts` (line 118), the `initialize` method has a guard clause: `if (get().isInitializing || (!force && get().initialized)) return;`. If a realtime sync triggers `initialize(true)` while an initial fetch (`isInitializing`) is in progress, the sync is silently dropped.
- **Backend IDOR Vulnerability**: In `supabase/migrations/01_seed_org_rpc.sql` (lines 6-10), the `seed_default_org(p_user_id UUID)` function runs with `SECURITY DEFINER` privileges. It uses `p_user_id` directly without verifying it against the authenticated user (`auth.uid()`).

## 2. Logic Chain

1. **Data Loss**: The cleanup block unconditionally wipes out all custom agents and skills upon initialization because it filters by hardcoded default names. Removing this block prevents custom data loss.
2. **Memory Leak**: The `subscribe()` methods register listeners on the global `supabase` client. Calling them inside a function that runs multiple times (especially triggered by its own callbacks) results in an unbounded O(N) listener growth. To fix, they must only be instantiated once.
3. **Race Condition**: Dropping the realtime sync event while fetching means the store will miss the most recent updates and become stale. By using a "dirty flag" (e.g., `pendingSync`), we can queue the sync event and re-fetch immediately after the current operation finishes.
4. **IDOR**: Because `SECURITY DEFINER` bypasses Row Level Security (RLS), an attacker can supply another user's UUID in `p_user_id` and overwrite their data. Validating `p_user_id = auth.uid()` secures the RPC against unauthorized modification.

## 3. Caveats

- It is assumed `auth.uid()` correctly resolves in the PostgreSQL execution context when called from the Supabase client.
- The `pendingSync` flag strategy assumes the `initialize` method won't get stuck in an infinite loop; the recursive call should only happen if a *new* sync event arrived *during* the fetch.

## 4. Conclusion

To fix the critical vulnerabilities, the following changes are required:
1. **Remove Destructive Block**: Delete lines 145-162 in `src/store/agentStore.ts`.
2. **Fix Memory Leak**: Wrap the `supabase.channel` setup in `src/store/agentStore.ts` with a check: `if (!get().initialized) { ... }`, ensuring it only runs on the very first successful initialization.
3. **Fix Race Condition**: Add a `pendingSync` boolean to the `AgentStore` state. In `initialize(true)`, if `isInitializing` is true, set `pendingSync` to true. In the `finally` block of `initialize`, check if `pendingSync` is true. If so, reset it and trigger `get().initialize(true)` again.
4. **Secure RPC**: In `supabase/migrations/01_seed_org_rpc.sql`, add the following check at the beginning of the `seed_default_org` function body:
   `IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'Unauthorized'; END IF;`

## 5. Verification Method

- **Data Loss**: Add a custom agent, refresh the page (triggering `initialize()`), and verify the custom agent remains.
- **Memory Leak**: Add `console.log` inside the `subscribe` blocks or monitor WebSocket traffic to ensure the channels are only registered once per session.
- **Race Condition**: Simulate network latency during `initialize()`, trigger a database update concurrently, and verify that a subsequent fetch is automatically queued and executed.
- **IDOR**: Log in as `User A`. Use the browser console to invoke `supabase.rpc('seed_default_org', { p_user_id: 'USER_B_UUID' })`. Confirm it throws an `Unauthorized` error.

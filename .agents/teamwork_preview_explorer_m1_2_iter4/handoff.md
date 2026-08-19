# Handoff Report: Iteration 4 Vulnerability Fixes

## 1. Observation
- **Destructive Data Loss**: In `src/store/agentStore.ts` (lines 145-162), there is a block marked `// --- TEMPORARY CLEANUP FOR NEW ORG STRUCTURE ---`. It queries agents and skills that do not match `DEFAULT_AGENTS`/`DEFAULT_SKILLS` and unconditionally executes `supabase.from('agents').delete().in(...)` and similar for skills.
- **Subscription Memory Leak**: In `src/store/agentStore.ts` (lines 221-232), `supabase.channel().subscribe()` is called at the end of the `initialize()` function. Since `initialize(true)` can be called repeatedly (e.g., from the `postgres_changes` listener itself), multiple listeners are spawned.
- **Frontend Realtime Sync Race Condition**: In `src/store/agentStore.ts` (line 118), the `initialize` method contains the lock check `if (get().isInitializing || (!force && get().initialized)) return;`. If a realtime event triggers `initialize(true)` while `isInitializing` is already true, the call is simply dropped without setting a dirty flag, meaning concurrent data changes will be missed.
- **Backend IDOR Vulnerability**: In `supabase/migrations/01_seed_org_rpc.sql` (lines 6-10), the `seed_default_org(p_user_id UUID)` function is declared with `SECURITY DEFINER` and takes `p_user_id` as an argument. However, the body (starting at line 20) directly inserts records using `p_user_id` without verifying if `p_user_id` matches `auth.uid()`.

## 2. Logic Chain
- The temporary cleanup block in the store was likely added during development to enforce standard agents but introduces catastrophic data loss for any user-created agents or skills in production. It must be removed.
- Re-executing `initialize()` is the correct approach to refetching on realtime events, but channel subscriptions must be registered exactly once per session. Checking if the store was already initialized before setting up the subscriptions avoids redundant listener registration.
- Bailing out on `isInitializing` avoids duplicate fetches, but completely ignoring forced re-initialization requests during a fetch causes missed updates. By introducing a `pendingSync` flag, we can record that an event fired during the fetch and immediately re-fetch once the current one completes.
- Since `seed_default_org` is `SECURITY DEFINER`, it bypasses RLS. A malicious actor could call this RPC with another user's UUID, causing the system to seed data for a victim user. Enforcing `p_user_id = auth.uid()` ensures the caller can only seed their own organization.

## 3. Caveats
- I did not run the migration. The implementer should ensure the `auth.uid()` check uses the correct context and that the `supabase` SQL syntax is perfectly standard (i.e., `IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'Unauthorized'; END IF;`).
- It is assumed that the store's `initialize()` is never called in parallel by multiple distinct React components at mount without `isInitializing` handling it correctly. The `pendingSync` logic should be sufficient.

## 4. Conclusion
We must implement the following changes:

**1. `src/store/agentStore.ts` Fixes:**
- Delete lines 145-162 (the temporary cleanup block).
- Add `pendingSync: boolean;` to the `AgentStore` interface and the initial state.
- Update `initialize()` to handle the queue:
```typescript
  initialize: async (force?: boolean) => {
    if (get().isInitializing) {
      if (force) set({ pendingSync: true });
      return;
    }
    if (!force && get().initialized) return;

    set({ isInitializing: true });
    const wasInitialized = get().initialized;
    try {
      // ... existing fetch logic
      
      set({ 
        // ... existing sets
        initialized: true 
      });

      // Realtime Sync
      if (!wasInitialized) {
        supabase.channel('public:tasks')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
            get().initialize(true);
          })
          .subscribe();

        supabase.channel('public:agents')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, (payload) => {
            get().initialize(true);
          })
          .subscribe();
      }
    } finally {
      const nextSync = get().pendingSync;
      set({ isInitializing: false, pendingSync: false });
      if (nextSync) {
        get().initialize(true);
      }
    }
  },
```

**2. `supabase/migrations/01_seed_org_rpc.sql` Fix:**
- Add an authentication check at the beginning of the `BEGIN` block:
```sql
BEGIN
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;
    -- ...
```

## 5. Verification Method
1. **Destructive Data Loss**: Start the app, create a custom agent. Reload the page (which calls `initialize()`). The custom agent should still exist.
2. **Subscription Leak**: Open browser dev tools and monitor websocket connections / React state. Call `initialize(true)` 5 times. The `supabase.channel()` should only have active listeners created once.
3. **Race Condition**: Simulate a delay in data fetching and trigger a realtime event during the fetch. The `pendingSync` flag should be hit and a subsequent refetch should occur right after the first finishes.
4. **IDOR Vulnerability**: Connect to the DB or run a query using `supabase rpc` logged in as User A, but pass User B's UUID to `seed_default_org`. It should fail with an "Unauthorized" exception.

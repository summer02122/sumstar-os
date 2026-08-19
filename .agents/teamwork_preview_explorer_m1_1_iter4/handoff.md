# Observation
1. **Destructive Data Loss**: In `src/store/agentStore.ts` (lines 145-162), `initialize()` contains a temporary cleanup block (`// --- TEMPORARY CLEANUP FOR NEW ORG STRUCTURE ---`) that deletes any agents and skills in the database whose names don't exactly match `DEFAULT_AGENTS` and `DEFAULT_SKILLS`.
2. **Subscription Memory Leak**: In `src/store/agentStore.ts` (lines 221-232), `supabase.channel().subscribe()` is called unconditionally inside `initialize()`. Since `initialize(true)` is called repeatedly by these exact event listeners, new listeners are stacked on every data fetch.
3. **Frontend Realtime Sync Race Condition**: In `src/store/agentStore.ts` (lines 117-119), `initialize()` exits immediately (`return;`) if `get().isInitializing` is true. When a realtime event fires `get().initialize(true)` while an initialization is already ongoing, the event is silently ignored (dropped), causing the client to miss updates.
4. **Backend IDOR Vulnerability**: In `supabase/migrations/01_seed_org_rpc.sql` (line 6), `seed_default_org(p_user_id UUID)` has `SECURITY DEFINER` meaning it runs with elevated privileges. However, the function body (lines 20+) blindly inserts data using the provided `p_user_id` without verifying if the caller owns that UUID, allowing users to seed data into other users' accounts.

# Logic Chain
1. The cleanup block in `agentStore.ts` causes data loss because it fires on every mount/refresh and unconditionally wipes user-created custom agents and skills. This needs to be removed.
2. The `subscribe()` memory leak happens because the setup is part of the recurring `initialize` flow. It should be wrapped in a conditional check (e.g., a `listenersSetup` flag in the store state) to ensure it runs only once per session.
3. The race condition occurs because there is no mechanism to remember that an update was requested during an ongoing fetch. Adding a `pendingSync` flag to the store, setting it if `force === true` while already initializing, and checking it in a `finally` block resolves this by triggering a follow-up fetch.
4. The IDOR vulnerability can be fixed by validating `p_user_id` against `auth.uid()` at the very beginning of the `seed_default_org` function body to ensure callers can only mutate their own organization.

# Caveats
- I did not test the frontend changes locally. The main agent must ensure that adding properties like `pendingSync` and `listenersSetup` to the Zustand store is properly typed in the `AgentStore` interface.
- If other RPCs take `p_user_id` in the future, they must also be checked for this IDOR vulnerability.

# Conclusion
We need to apply four specific fixes across two files:
1. **Remove Data Loss Block**: Delete lines 145-162 from `src/store/agentStore.ts`.
2. **Fix Realtime Subscriptions & Race Conditions**: Update the `AgentStore` interface and `initialize` method in `src/store/agentStore.ts` to use `pendingSync` and `listenersSetup` flags.
3. **Fix IDOR Vulnerability**: Add `IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'Unauthorized'; END IF;` to the `seed_default_org` function in `supabase/migrations/01_seed_org_rpc.sql`.

# Verification Method
1. `cat src/store/agentStore.ts` to ensure the cleanup block is gone and the `initialize()` logic correctly implements `pendingSync` and `listenersSetup`.
2. `cat supabase/migrations/01_seed_org_rpc.sql` to ensure `auth.uid()` is validated.
3. Run `npm run build` or the project's equivalent type check to verify the Zustand store interface modifications are valid.

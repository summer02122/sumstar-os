# 1. Observation
- **Realtime Synchronization**: In `src/store/agentStore.ts:117-118`, the `initialize()` function guards with `if (get().isInitializing || get().initialized) return;`. The Supabase channel listeners (lines 262-273) call `get().initialize()`. Since `initialized` is true after the first load, realtime events are ignored.
- **Auto-Seeding Logic**: The auto-seeding of `DEFAULT_SKILLS` and `DEFAULT_AGENTS` happens client-side in `agentStore.ts` (lines 145-210) via sequential `supabase.from(...).insert(...)` calls.
- **UUID Mapping Error**: In `agentStore.ts:175`, `found = currentSkillsData.find(s => s.name === ds.name || s.id === ds.tempId)` compares `s.id` (a UUID from the DB) with `ds.tempId` (a string like 'ask-context'), falling back to `name`.
- **Rollback Crash**: In `agentStore.ts:202-207`, the manual rollback inside the `catch` block issues `await supabase.from(...).delete()` without its own `try/catch`.
- **Database Migrations**: `supabase/migrations/` currently only contains `00_rag_setup.sql`. No unique constraints exist for `agents` or `skills` based on `(user_id, name)`.

# 2. Logic Chain
- The realtime sync listeners fail to trigger state updates because `initialize()` lacks a parameter to bypass the `initialized` guard.
- Client-side auto-seeding across multiple distributed clients (or tabs) lacks locking. Concurrent execution will result in race conditions, inserting duplicate skills and agents.
- The manual client-side rollback is not transactional. If a network interruption occurs during the rollback itself, the unhandled promise rejection crashes the app and leaves the database in a partial state (e.g., skills inserted but no agents).
- RLS blockages on newly inserted records can cause `.select()` to return empty, leading to the silent mapping failure where default agents are inserted with empty `skill_ids`.
- Shifting the seeding logic to a Postgres RPC (`SECURITY DEFINER`) solves these issues atomically. The RPC can bypass RLS for internal mapping, execute as a single transaction (preventing partial states), and combined with DB-level unique constraints, it completely mitigates race conditions.

# 3. Caveats
- Moving auto-seeding to an RPC means `reseed_org.ts` will rely on the client hitting the RPC on reload to populate data. The script currently deletes existing data correctly, which is sufficient.
- The `user_id` and `name` unique constraints must be applied carefully if users are allowed to manually create multiple agents with the identical name. If this is a valid use case, the constraint could be specifically targeted or scoped, but for default system agents, a global `(user_id, name)` constraint is standard.

# 4. Conclusion
**Proposed Strategy for Iteration 3:**

1. **DB-Level Fix for Auto-Seeding (RPC + Migration):**
   - **Migration**: Create a new Supabase migration to add `UNIQUE(user_id, name)` constraints to the `skills` and `agents` tables.
   - **RPC**: Create a Postgres function `seed_default_org(p_user_id UUID)` with `SECURITY DEFINER`. This function will insert the default skills and agents within a single transaction using `ON CONFLICT DO NOTHING`. It will handle the internal UUID mapping of skills to agents directly via Postgres variables, eliminating the `tempId` client-side bug and the RLS silent mapping failure.

2. **Client-Side Refactoring (`src/store/agentStore.ts`):**
   - **Remove Manual Seeding & Rollback**: Delete the entire client-side auto-seeding and manual rollback block (lines 145-210). Replace it with a single call to `await supabase.rpc('seed_default_org', { p_user_id: user.id })` if no agents exist, followed by fetching the data. This eliminates the Rollback Crash and race conditions.
   - **Fix Realtime Sync**: Update the `initialize` method signature to `initialize: (force?: boolean) => Promise<void>`. Modify the guard to `if (get().isInitializing || (!force && get().initialized)) return;`. Update the realtime subscriptions to call `get().initialize(true)`.

# 5. Verification Method
- **Realtime Sync**: Open two tabs. In Tab 1, update an agent's state or task. Verify Tab 2 updates automatically without manual refresh.
- **Race Condition & Partial State**: Clear data using `npm run reseed_org <user_id>` or similar. Simulate concurrent seeding by forcing two identical API calls to `seed_default_org` simultaneously. Verify the DB only contains exactly 3 default agents and 8 default skills, with no duplicates.
- **Mapping**: Check the database `agents` table. The default agents should have valid UUID arrays in `skill_ids`, resolving the silent mapping and UUID errors.

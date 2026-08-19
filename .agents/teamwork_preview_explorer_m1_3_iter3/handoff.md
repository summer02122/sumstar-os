# Handoff Report: Vulnerabilities in agentStore.ts

## 1. Observation
- **Broken Realtime Synchronization**: In `src/store/agentStore.ts`, the realtime listeners at line 263 and 269 call `get().initialize()`. However, `initialize()` has an early exit guard `if (get().isInitializing || get().initialized) return;` at line 118. Since `initialized` is set to `true` at line 259, all subsequent realtime sync calls do nothing.
- **Silent Mapping Failure & UUID Mapping Error**: At line 175, the code attempts to map default skills to DB records using `s.name === ds.name || s.id === ds.tempId`. `s.id` is a DB-generated UUID, while `ds.tempId` is a hardcoded string (e.g., `'ask-context'`), so they never match. It falls back to name matching. If RLS blocks `SELECT`, `skillsData` is empty, leading to empty mappings and inserting agents without valid `skill_ids`.
- **Race Condition in Auto-Seeding**: Multiple browser tabs loading the app simultaneously will bypass local `isInitializing` locks (which are per-tab). Both tabs will see missing skills/agents (lines 146-147) and attempt to `insert` them (lines 164, 193), resulting in duplicate DB records.
- **Rollback Crash / Partial State Vulnerabilities**: If the agent insert fails, the `catch` block (lines 201-209) attempts manual rollback using asynchronous `delete()` calls. These calls lack their own `try-catch` wrapper. If the client loses network connectivity during the insert, the subsequent `delete` calls will throw unhandled promise rejections. Furthermore, manual client-side rollbacks are not atomic and can easily result in corrupted DB states (e.g., orphaned skills).
- **reseed_org.ts**: The script deletes agents and skills sequentially without a transaction, which could result in a partial state if the script crashes mid-execution.

## 2. Logic Chain
1. Because realtime listeners call a function guarded by `initialized === true`, they can never refresh the data once the app has loaded.
2. Because default skills are inserted via client-side operations without database-level uniqueness constraints or transactions, concurrent client connections will inherently cause race conditions and duplicate entries.
3. Because UUIDs (`s.id`) are compared to string literals (`ds.tempId`), the ID fallback is broken.
4. Because the rollback is manual and client-side, any network interruption or unhandled rejection during the process will leave the DB in a partial state.

## 3. Caveats
- The exact RLS policies on the `skills` and `agents` tables were not examined, but we assume they might block `SELECT` under certain conditions or have potential delays, leading to empty reads.
- We assume `supabase.rpc` is permissible for the project, as it is the most robust way to handle atomic seeding.

## 4. Conclusion
The client-side auto-seeding logic in `agentStore.ts` is fragile, non-atomic, and prone to race conditions. The realtime sync mechanism is fundamentally broken by design due to conflating initialization with data fetching.

**Recommendations for Iteration 3:**
1. **Database Level (Crucial)**:
   - Create a Supabase migration to add a `UNIQUE(user_id, name)` constraint on the `skills` and `agents` tables to prevent duplicate seeding.
   - (Optional but Highly Recommended) Create a Postgres RPC function (e.g., `seed_default_org()`) to handle the checking and inserting of default data atomically in a single transaction. This completely eliminates client-side race conditions and partial states.
2. **Client Store Level (`agentStore.ts`)**:
   - Separate state bootstrapping from data fetching. Rename the fetching logic to `fetchData()` (without the `initialized` guard) and have `initialize()` call it. The realtime listeners must call `fetchData()`, not `initialize()`.
   - Remove the `s.id === ds.tempId` UUID comparison; rely strictly on `name` mapping, which is safe once uniqueness constraints are in place.
   - If continuing with client-side seeding (instead of RPC), wrap the `upsert` operations in proper error handling, remove the manual `delete` rollback, and rely on `onConflict` clauses using the new unique constraints. Wrap manual rollbacks in `try-catch` if they must remain.
3. **`reseed_org.ts`**:
   - Wrap the operations in a single transaction using an RPC if possible, or ensure robust error handling.

## 5. Verification Method
- **Realtime Sync**: Update a task status in the Supabase dashboard; verify that the client UI updates automatically without a page refresh.
- **Race Condition**: Open the app in 5 tabs simultaneously on a fresh account; check the database to ensure exactly 8 skills and 3 agents are created without duplicates.
- **Rollback / Crash**: Modify `agentStore.ts` to simulate a network failure during agent insert; verify the app handles the error gracefully without throwing unhandled rejections and leaves no orphaned skills in the database.

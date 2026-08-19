# Handoff Report: Iteration 3 Vulnerability Fixes

## 1. Observation
- **Realtime Sync Dead Code**: In `src/store/agentStore.ts` (lines 263-273), realtime listeners call `get().initialize()`. However, `initialize()` (line 118) has an early exit `if (get().isInitializing || get().initialized) return;`. Since `initialized` is true after the first load, realtime updates are ignored.
- **Silent Mapping Failure**: If RLS policies block `SELECT` on `skills` (lines 129-130), `skillsData` is empty but no error is thrown. The logic proceeds, thinks skills are missing, and tries to insert them, failing to map valid `skill_ids` for agents.
- **Race Condition in Auto-Seeding**: Multiple browser tabs running `initialize()` concurrently will all see missing skills/agents and attempt to insert them, resulting in duplicates.
- **Rollback Crash**: In `agentStore.ts` (lines 202-208), the manual `delete()` rollback in the `catch` block lacks its own `try-catch`. A network failure during rollback throws an unhandled promise rejection.
- **UUID Mapping Error**: Line 175 checks `s.id === ds.tempId`, comparing a database UUID (`s.id`) to a hardcoded string like `'ask-context'`, which always fails.

## 2. Logic Chain
- To fix the **realtime sync**, we must separate the initial loading/seeding logic from data refreshing. A dedicated `refreshData()` function without early exits is needed.
- To fix **race conditions**, the database needs `UNIQUE(user_id, name)` constraints on `skills` and `agents`. Client-side checks are insufficient for distributed concurrency.
- To fix **partial states (orphaned skills)**, **rollback crashes**, and **UUID mapping errors**, the multi-step seeding process must be atomic. A Supabase RPC function (Postgres transaction) can handle inserting skills, mapping their generated UUIDs correctly, and inserting agents in one go, with automatic DB-level rollback on failure.

## 3. Caveats
- Moving seeding to an RPC means we need to generate and run a Supabase migration. The exact names of the existing tables and columns must match (`user_id`, `name`, `skill_ids`, etc.).
- The unique constraint assumes a user cannot have two agents or skills with the exact same name. This is generally a good practice but restricts users from naming duplicates.

## 4. Conclusion & Strategy
We should implement a **Hybrid DB and Client-Side Strategy**:
1. **Create a Supabase Migration**:
   - Add `UNIQUE(user_id, name)` to `skills` and `agents`.
   - Create a Postgres RPC `seed_default_org()` that atomically inserts missing default skills, captures their UUIDs, and inserts default agents with the correct `skill_ids`.
2. **Refactor `agentStore.ts`**:
   - Call `supabase.rpc('seed_default_org')` during `initialize()`, replacing the fragile client-side check-insert-rollback logic.
   - Extract the state-fetching logic into a new `fetchState()` method.
   - Update the `supabase.channel` listeners to call `fetchState()` instead of `initialize()`.

## 5. Verification Method
- **Verify DB changes**: Run the migration and attempt to manually insert duplicate skills/agents; the unique constraint should reject it.
- **Verify Concurrency**: Open multiple tabs simultaneously and clear local storage; only one set of default agents/skills should be created.
- **Verify Realtime**: Open two tabs, edit an agent in tab A, and ensure the change appears instantly in tab B (without page refresh).

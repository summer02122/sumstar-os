# Handoff Report: Milestone 1 Fix Strategy

## 1. Observation
- `src/store/agentStore.ts` line 139 checks `if (skills.length === 0 && agentsData.length === 0)` to trigger the auto-seed.
- Supabase fetch operations (lines 122, 125, 134) do not check for the `error` object. They assume that if `data` is empty/null, the tables are empty.
- The `initialize` function (line 115) checks `get().initialized` but this flag is only set at the very end of the async function (line 219), leaving a wide window for race conditions.
- `skillIdMap` (line 151) is populated exclusively using `insertedSkills`. If skills were not inserted (e.g., they already existed), the map remains empty.
- There is no transactional wrapper for inserting skills and agents; they happen sequentially (lines 147, 171).

## 2. Logic Chain
- Because the auto-seed condition uses `&&`, a partial state (e.g., agents missing but skills present) prevents the missing agents from being seeded.
- Because `error` is ignored on fetch, a network timeout will result in `skills` and `agentsData` appearing empty, triggering a duplicate auto-seed when the network recovers.
- Because there is no synchronous lock, multiple components calling `initialize()` simultaneously will execute the fetch and auto-seed logic concurrently, resulting in race conditions and duplicate entries.
- Because `skillIdMap` relies on `insertedSkills`, if the system only seeds missing agents but skips skills (due to partial state), it will fail to map the required `skill_temp_ids` to real UUIDs.
- Because there is no transaction, a failure during agent insertion leaves the database with orphaned skills. However, implementing an idempotent sync strategy neutralizes this issue, as subsequent initializations will simply resume seeding the missing agents.

## 3. Caveats
- This fix relies on client-side idempotency rather than true database transactions (since we lack a custom Supabase RPC). Partial failures will leave data in the database until the next successful initialization resolves the missing pieces.
- Matching skills and agents by `name` assumes that `name` is unique and immutable. If a user renames a default skill or agent manually, the system might re-seed a duplicate. (This is acceptable for default entities).

## 4. Conclusion
To resolve the feedback without altering `reseed_org.ts`, the `initialize` function in `src/store/agentStore.ts` must be refactored to use an idempotent synchronization algorithm. 
1. Implement a synchronous `isInitializing` lock state at the beginning of `initialize()` and use a `try/finally` block.
2. Add explicit error checks (`if (error) throw error;`) after fetching `user_settings`, `skills`, and `agents`.
3. Separate the auto-seed logic into two independent checks: one for missing skills and one for missing agents.
4. Insert only missing skills (by checking against `DEFAULT_SKILLS`). Then, build a comprehensive list of all skills.
5. Build `skillIdMap` by mapping `DEFAULT_SKILLS` to the comprehensive skills list (matching by name) to ensure all UUIDs are captured.
6. Insert only missing agents (by checking against `DEFAULT_AGENTS`), utilizing the comprehensive `skillIdMap`.

## 5. Verification Method
- **Race Condition:** Add a `console.log` at the start of `initialize()` and call it multiple times synchronously in the UI. Ensure the API is only hit once.
- **Network Error:** Temporarily mock the Supabase client to return `{ error: new Error('Network Error') }` on the `select` calls and verify that auto-seed does not run.
- **Partial State (Skills exist, Agents missing):** Delete all agents in the database but leave the skills. Refresh the page. Verify that agents are re-created and successfully linked to the existing skills (UUIDs mapped correctly).
- **Partial State (Agents exist, Skills missing):** Delete all skills in the database but leave the agents. Refresh the page. Verify that skills are re-created (Note: agents' `skill_ids` won't automatically update unless we write logic for it, but the primary requirement is syncing missing entities).

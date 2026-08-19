# Handoff Report: Org Restructure Fix Strategy

## 1. Observation
- `src/store/agentStore.ts` currently groups the auto-seed condition as `if (skills.length === 0 && agentsData.length === 0)`.
- It performs DB `select()` queries without checking the `error` object, defaulting to empty arrays on failure.
- The UUID mapping for `skill_ids` strictly iterates over `insertedSkills` (lines 151-157).
- The store uses a single `initialized` flag set at the end of the async function (line 219), offering no synchronous protection against concurrent calls.
- There is no `try...catch` block around the database `insert` operations (lines 147-171) to rollback partial data.
- `scripts/reseed_org.ts` correctly drops all agents and skills based on `user_id`.

## 2. Logic Chain
- **Partial State Failure:** Grouping the auto-seed condition means if agents are missing but skills exist, agents are never seeded. Separating them into `needsSkillSeed` and `needsAgentSeed` resolves this.
- **Duplication on Network Error:** Ignoring `select()` errors causes the app to interpret a failed fetch as "0 records found", triggering unnecessary auto-seeding. Aborting early on `error` prevents this.
- **Fragile UUID Mapping:** Relying solely on `insertedSkills` for UUID mapping fails when skills already exist. Mapping from the unified `skillsData` pool guarantees resolution.
- **Race Condition:** Because `initialized` is set asynchronously, React Strict Mode or multiple components mounting simultaneously will bypass the guard and execute concurrent DB inserts. A synchronous `isInitializing` lock prevents this.
- **Partial Failure Rollback:** If agent insertion fails mid-process, the previously inserted skills remain orphaned. Catching the error and executing a compensatory `delete()` cleans up the partial state.

## 3. Caveats
- This strategy assumes the database schema does not have `UNIQUE` constraints on `skills.name` or `agents.name` that would naturally reject duplicates, making the client-side error handling and locks completely necessary.
- We rely on a client-side compensating transaction (a `delete` query) rather than a true Postgres RPC transaction. While less atomic, it fits the existing client-side heavy architecture without requiring backend schema migrations.
- Multiple browser tabs could technically still race if they bypass the Zustand lock, but the `isInitializing` flag perfectly stops the primary issue: React double-rendering.

## 4. Conclusion
The initialization logic in `src/store/agentStore.ts` must be refactored to apply the following step-by-step fix strategy:
1. **Locking:** Add `isInitializing: boolean` to the store and set it synchronously at the top of `initialize()`. Use `try...finally` to release it.
2. **Error Handling:** Check `error` on all `supabase.from(...).select()` calls. If `error` exists, `throw` it to abort initialization immediately.
3. **Independent Sync:** Evaluate `skillsData.length === 0` and `agentsData.length === 0` separately to decide what needs seeding.
4. **Robust Mapping:** Build the `skillIdMap` by iterating over the complete `skillsData` list (after any inserts), matching by `name`.
5. **Transactional Rollback:** Wrap the insert operations in a `try...catch`. If agent insertion fails, check if `insertedSkillIds.length > 0` and execute `await supabase.from('skills').delete().in('id', insertedSkillIds)` before re-throwing.

## 5. Verification Method
- **Verify Partial State:** Delete all agents from the DB but leave the skills. Reload the app. Ensure agents are recreated and successfully mapped to the existing skills.
- **Verify Network Error:** Mock a network failure on `select()` (e.g., turn off Wi-Fi or block the request). Ensure no duplicate inserts are attempted.
- **Verify Race Condition:** Wrap `initialize()` in a `useEffect` without strict mode disabled, or manually call it twice synchronously. Ensure only one network insert request is made.
- **Verify Rollback:** Force the `agents` insert query to fail (e.g., by omitting a required non-null field in the payload temporarily). Ensure the newly created skills are deleted from the database.

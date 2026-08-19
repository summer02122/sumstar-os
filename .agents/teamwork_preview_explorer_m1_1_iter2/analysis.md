# Analysis Report: Auto-seed Logic Fixes

## Problem Summary
The current auto-seed logic in `src/store/agentStore.ts` contains several critical bugs that manifest under partial states or network failures. Specifically, the synchronization condition is too rigid, error checking on database queries is missing, UUID mapping relies solely on newly inserted skills, there is no rollback mechanism for partial failures, and race conditions can cause duplicate execution.

## Observations

1. **Race Condition**
   - **Location:** `src/store/agentStore.ts`, line 116 (`if (get().initialized) return;`)
   - **Issue:** Multiple concurrent calls (e.g., from React StrictMode or multiple tabs) evaluate `initialized` as `false` simultaneously, triggering parallel auto-seed executions.

2. **Missing Error Handling**
   - **Location:** `src/store/agentStore.ts`, lines 125, 134.
   - **Issue:** `supabase.from(...).select('*')` does not check for the `error` object. On network failure, `skillsData` and `agentsData` become `null`. This triggers `skills.length === 0 && agentsData.length === 0`, causing duplicate seeding attempts during outages.

3. **Partial State Failure**
   - **Location:** `src/store/agentStore.ts`, line 139 (`if (skills.length === 0 && agentsData.length === 0)`)
   - **Issue:** If agents are deleted but skills remain (or vice versa), the condition evaluates to `false`. Missing default components are not restored, breaking system requirements.

4. **Fragile UUID Mapping**
   - **Location:** `src/store/agentStore.ts`, lines 150-157
   - **Issue:** The `skillIdMap` is populated *only* from `insertedSkills`. If a skill was already in the database and skipped insertion (due to partial state), its UUID is not mapped. Consequently, assigned `skill_ids` for agents will be `undefined`.

5. **No Transactional Rollback**
   - **Location:** `src/store/agentStore.ts`, lines 147-171
   - **Issue:** If the skills insertion succeeds but the agents insertion fails, the system is left in a dirty state. There is no `try...catch` to perform a manual cleanup (rollback) of the partially inserted data.

## Fix Strategy

### 1. Concurrency Control (Race Condition)
Introduce an `isInitializing` flag in the `AgentStore` interface.
- Before fetching data, check: `if (get().initialized || get().isInitializing) return;`
- Immediately `set({ isInitializing: true })`.
- Use a `try...finally` block to ensure `set({ isInitializing: false })` is called when done.

### 2. Guard Against Network Errors
Always extract and check the `error` object from Supabase queries.
- `const { data: skillsData, error: skillsError } = await supabase.from('skills').select('*');`
- If `skillsError` or `agentsError` exists, throw an error to abort initialization safely.

### 3. Independent Synchronization (Partial States)
Separate the checks for missing skills and missing agents.
- Calculate `missingSkills` by checking which `DEFAULT_SKILLS` names are absent from `skillsData`.
- Calculate `missingAgents` by checking which `DEFAULT_AGENTS` names are absent from `agentsData`.
- Only insert the missing items.

### 4. Robust UUID Mapping
Build the `skillIdMap` from a **combined list** of existing and newly inserted skills.
- After inserting missing skills, combine them: `const allSkills = [...(skillsData || []), ...newlyInsertedSkills];`
- Generate `skillIdMap` iterating over `allSkills`, so both existing and new skills are mapped to their `tempId`.

### 5. Manual Rollback (Transactional Safety)
Wrap the seeding process in a `try...catch` block and keep track of newly inserted IDs.
- If the agent insertion fails after skills were successfully inserted, execute a deletion query to rollback the inserted skills.
- `await supabase.from('skills').delete().in('id', newlyInsertedSkillIds);`

### 6. Leave `reseed_org.ts` As-Is
The user confirmed that deleting all agents and skills in `reseed_org.ts` is intentional. No changes are required to the destructive behavior of that script.

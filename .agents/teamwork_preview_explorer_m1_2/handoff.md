# Handoff Report: Milestone 1 Fix Strategy

## 1. Observation
- `src/store/agentStore.ts` contains a disabled auto-seeding block in the `initialize` method: `// Removed auto-seeding logic so deleted agents don't respawn.`
- `supabase_skills.sql` defines `skills.id` as a UUID (`uuid_generate_v4()`) and `agents.skill_ids` as `JSONB`.
- The user requires defining new standard skills (Ask Context, Planning, Documentation, Communication, Review, Delegation, Consistency, Memory) and replacing default agents with SUM, SATIN, and SINCARE.
- The prompt requests a migration script `scripts/reseed_org.ts` to wipe existing user setup to trigger this re-seeding.

## 2. Logic Chain
1. To fulfill the new organizational structure, we must hardcode `defaultSkills` and the updated `defaultAgents` (SUM, SATIN, SINCARE) in `src/store/agentStore.ts`.
2. Since `skill.id` in the database is a UUID, we cannot assign arbitrary string IDs (e.g., "ask-context") directly to the DB. We must insert the skills first, capture their generated UUIDs, and map them to the `defaultAgents.skill_ids` array before inserting the agents.
3. The `initialize` method must handle this seeding process. To prevent infinite respawning of agents if a user intentionally deletes them, the seed condition should trigger only if both `skills` and `agents` tables are completely empty.
4. The migration script `scripts/reseed_org.ts` simply needs to connect to Supabase and delete all records in the `agents` and `skills` tables for a specified user. This perfectly sets the condition (`skills.length === 0 && agentsData.length === 0`) for the frontend to execute the new seeding logic.

## 3. Caveats
- The migration script requires the `SUPABASE_SERVICE_ROLE_KEY` to bypass Row Level Security when operating externally. If this key is unavailable, the user must manually clear the tables from the Supabase dashboard. 
- The auto-seed logic will trigger if a user manually deletes ALL their agents AND ALL their skills. If they want zero agents and zero skills permanently, they cannot have both tables empty at the same time without triggering a re-seed. 

## 4. Conclusion
The implementation requires modifying `src/store/agentStore.ts` to add the `defaultSkills`, the new `defaultAgents`, and a procedural seeding block in `initialize()`. Then, we must create `scripts/reseed_org.ts` to clear existing data, paving the way for the new structure.

### Implementation Steps for the Implementer:
1. **In `src/store/agentStore.ts`:**
   - Define `export const defaultSkills` array with the 8 specified skills (including a temporary `id` property like `ask-context`).
   - Define `export const defaultAgents` array representing SUM, SATIN, and SINCARE. Map their required skills using the temporary `id`s in their `skill_ids` array.
   - In `initialize()`, replace the disabled auto-seed block with a conditional `if (skills.length === 0 && agentsData.length === 0)`.
   - Inside the condition, perform a database `insert` for the skills, resolve the returned UUIDs to their temporary string IDs, construct the agents with the resolved UUIDs, and `insert` the agents.
2. **In `scripts/reseed_org.ts`:**
   - Create a standalone Node script that imports `@supabase/supabase-js` and `@next/env`.
   - Authenticate using `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
   - Accept a `USER_ID` via `process.argv[2]`.
   - Execute a delete query on `agents` and `skills` where `user_id = USER_ID`.

## 5. Verification Method
- After applying the changes, run `npx tsc --noEmit` to ensure no type errors.
- Ensure the user has valid environment variables set (`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`).
- Run `npx tsx scripts/reseed_org.ts <USER_ID>`. It should succeed without errors and print deletion confirmations.
- Load the frontend application as the target user. Check the browser console or network tab to verify that `insert` calls to `skills` and `agents` execute successfully.
- Verify in the UI that exactly 3 agents (SUM, SATIN, SINCARE) appear and have their respective skills attached.

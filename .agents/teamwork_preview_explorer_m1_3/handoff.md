# Handoff: Milestone 1 - Org Restructure

## Observation
- `src/store/agentStore.ts` contains an obsolete `defaultAgents` array (lines 86-92) and an `initialize` function (lines 106-177) that currently lacks auto-seeding logic.
- Agent and Skill tables use auto-generated IDs. Agents are linked to Skills via a `skill_ids` array of strings (lines 30, 41-46).
- The `scripts/` directory exists but does not yet contain `reseed_org.ts`. 

## Logic Chain
1. To implement R1 and R2, we must define the new Skills and Agents as JavaScript objects in `agentStore.ts`. Because the exact database UUIDs of the Skills won't be known until insertion, we need to map them using unique string keys (e.g. `key: 'ask-context'`).
2. To satisfy R3 and R4, the `initialize` function in `agentStore.ts` must detect when an organization is completely empty (`skillsData.length === 0` and `agentsData.length === 0`). When empty, it should:
   - Insert all default skills and fetch their database-generated IDs.
   - Build a dictionary mapping the skill `key`s to their new IDs.
   - For each new Agent (SUM, SATIN, SINCARE), map its required skill keys to the DB IDs and insert the Agents.
3. For R5, the `scripts/reseed_org.ts` script needs to connect to Supabase, wipe out the `agents` and `skills` tables, and trigger the re-seed. The simplest and most robust way to do this without bypassing RLS with a service key (if not available) is to allow the script to take User ID or run with a Service Key, but since the `initialize` function will handle the seeding on next page load, the script only strictly needs to delete the existing records.

## Caveats
- The script `scripts/reseed_org.ts` will need database deletion rights. If RLS blocks unauthenticated deletes, the script will need to be run using `SUPABASE_SERVICE_ROLE_KEY` (which the user must add to `.env.local`), or it must accept user credentials to authenticate before deleting.
- The user's prompt mentions `quality-control` for SATIN, but the shared skills call it `Review`. The implementation should map `quality-control` to the `Review` skill.
- The prompt mentions `memory` for SINCARE, which is not strictly defined in the shared skills, so a custom `Memory` skill needs to be added to the defaults.

## Conclusion
The implementer should proceed with:
1. Deleting the old `defaultAgents` array in `agentStore.ts`.
2. Defining `DEFAULT_SKILLS` and `DEFAULT_AGENTS` constants in `agentStore.ts` with the new SUM, SATIN, and SINCARE configurations.
3. Adding the seeding logic inside `initialize()` in `agentStore.ts` (triggered only when the user's DB has 0 agents and 0 skills).
4. Creating `scripts/reseed_org.ts` using `@supabase/supabase-js` and `dotenv` to connect to the DB and execute `delete()` on `agents` and `skills`, wiping the state so the next app load triggers the new initialization.

## Verification Method
1. Run `npx tsx scripts/reseed_org.ts` (ensure `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local` if needed for bypass).
2. Load the application in the browser. 
3. Verify that `initialize` runs and populates the DB with the 8 new skills and 3 new agents (SUM, SATIN, SINCARE).
4. Inspect the agents in the UI to confirm they have the correct `skill_ids` assigned.

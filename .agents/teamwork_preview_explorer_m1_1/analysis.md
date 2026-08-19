# Analysis: Org Restructure (Milestone 1)

## Core Findings
1. **Existing Setup:** `src/store/agentStore.ts` contains a `defaultAgents` array (CEO, Research, Coding, Writer, Designer) but no `defaultSkills`. Auto-seeding logic was previously removed for agents.
2. **Skill Definitions:** We need to parse the shared rules from the prompt into a standard `Skill` schema with `name`, `description`, and `sop`.
3. **Agent Definitions:** We need to replace `defaultAgents` with SUM, SATIN, and SINCARE, assigning the correct subsets of `skill_ids`.
4. **Initialization Logic:** `agentStore.ts` needs a block in `initialize()` to detect if a user has no skills/agents and automatically seed them. It must insert skills *first*, retrieve their generated UUIDs, and map those UUIDs into the `skill_ids` array of the new agents.
5. **Migration Script:** We can create `scripts/reseed_org.ts` utilizing `SUPABASE_SERVICE_ROLE_KEY` to wipe all existing rows in the `agents` and `skills` tables. Once wiped, the frontend's updated `initialize()` will automatically reseed the next time the app loads.

## Proposed Skill Set
- **ask-context**: Ask questions when information is missing.
- **planning**: Break down tasks into sequential steps.
- **documentation**: Organize and format information clearly.
- **communication**: Communicate clearly and concisely.
- **review**: Check completeness and correctness.
- **delegation**: Escalate to SUM if out of scope.
- **consistency**: Maintain uniform output format.
- **memory**: Capture and categorize information (SINCARE).

## Execution Details
- Update `src/store/agentStore.ts` by replacing `defaultAgents` with the new definitions and adding `defaultSkills`.
- Modify the `initialize()` method to execute a two-step Supabase insert (skills -> agents).
- Add `scripts/reseed_org.ts` using `@supabase/supabase-js` and the Service Role Key.

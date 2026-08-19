# Milestone 1 (Org Restructure) - Fix Strategy Analysis

## 1. Overview
The current implementation in `src/store/agentStore.ts` attempts to auto-seed default agents (SUM, SATIN, SINCARE) and their granular skills if the database is completely empty. However, the initial implementation was fragile and failed on several edge cases. This document analyzes the feedback and breaks down a robust fix strategy.

## 2. Feedback Analysis

### Feedback 1: Fails on partial states
**Issue:** `if (skills.length === 0 && agentsData.length === 0)` only seeds if both tables are completely empty. If a user deletes agents but leaves skills (or vice versa), the missing default entities are never re-created.
**Fix:** Implement independent idempotent synchronization for both skills and agents.

### Feedback 2: No transactional rollback for partial failures
**Issue:** If skill insertion succeeds but agent insertion fails, the system is left in a partially seeded state. If an error occurs, there is no rollback.
**Fix:** Since we are operating from a client-side store without access to a native Supabase RPC transaction, we should rely on the idempotent sync pattern from Fix 1. If a failure occurs mid-way, the next initialization will pick up exactly where it left off by only inserting the missing records. We can also add `try/catch` blocks and manual cleanup if absolutely necessary, but idempotency is safer.

### Feedback 3: Missing error handling on `select()`
**Issue:** When fetching data (`await supabase.from('...').select('*')`), network errors return an `error` object. The current code ignores this, treating an error as an empty result, which triggers an accidental auto-seed that creates duplicates when the network recovers.
**Fix:** Explicitly check `if (error) throw error;` after every `select()`. If a fetch fails, abort initialization immediately.

### Feedback 4: Race condition on multiple tabs
**Issue:** `if (get().initialized) return;` only prevents duplicate calls *after* the `initialize` function finishes. If `initialize` is triggered simultaneously by multiple components or tabs, they will all pass this check and run the auto-seed concurrently.
**Fix:** Introduce an `isInitializing` flag (or a module-level lock promise) that is set synchronously at the very beginning of the function. 

### Feedback 5: UUID mapping is fragile
**Issue:** `skillIdMap` is built only from `insertedSkills`. If skills already existed in the database (partial state), their UUIDs won't be in `insertedSkills`, causing agent insertion to fail because `skillIdMap[tempId]` evaluates to undefined.
**Fix:** Build the `skillIdMap` using the comprehensive list of skills AFTER the sync is complete (i.e., combining pre-existing skills and newly inserted skills).

## 3. Recommended Step-by-Step Implementation Strategy

1. **Add Initialization Lock:**
   Add `isInitializing: false` to the store state. At the start of `initialize()`:
   ```typescript
   if (get().initialized || get().isInitializing) return;
   set({ isInitializing: true });
   ```
   Wrap the rest in a `try...finally` block that sets `isInitializing: false`.

2. **Strict Error Checking on Fetches:**
   For `user_settings`, `skills`, and `agents` fetches, capture the `error` object. If `error` is truthy, throw an error or abort early to prevent accidental seeding.

3. **Idempotent Skills Sync:**
   - Extract the names of all fetched skills.
   - Filter `DEFAULT_SKILLS` to find the ones missing from the database.
   - If there are missing skills, insert them.
   - Re-fetch skills or combine the inserted skills with the originally fetched skills into a single `allSkills` array.

4. **Robust Skill ID Mapping:**
   Create `skillIdMap` by iterating through `DEFAULT_SKILLS` and finding the matching skill by `name` in `allSkills`. This ensures we have the correct UUID regardless of whether the skill was just inserted or already existed.

5. **Idempotent Agents Sync:**
   - Extract the names of all fetched agents.
   - Filter `DEFAULT_AGENTS` to find the ones missing from the database.
   - For each missing agent, resolve `skill_ids` using the robust `skillIdMap`.
   - Insert the missing agents.
   - Re-fetch agents or combine the newly inserted ones with the originally fetched ones.

6. **Finalize State:**
   Update the local Zustand store with the comprehensive `agents` and `skills` lists and set `initialized: true`.

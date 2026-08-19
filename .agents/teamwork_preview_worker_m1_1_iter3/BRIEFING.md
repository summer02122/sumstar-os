# BRIEFING — 2026-07-21T22:30:00+07:00

## Mission
Implement DB-level seed RPC and refactor `agentStore.ts` to use it for atomic auto-seeding.

## 🔒 My Identity
- Archetype: implementer
- Roles: implementer, qa, specialist
- Working directory: c:/Users/siraw/OneDrive/Desktop/sumstar-os/.agents/teamwork_preview_worker_m1_1_iter3
- Original parent: 5fe64253-845f-47e1-9403-25a57b21b2ec
- Milestone: Milestone 1, Iteration 3

## 🔒 Key Constraints
- DO NOT CHEAT. All implementations must be genuine.
- No hardcoded test results or facade implementations.
- Must implement `UNIQUE(user_id, name)` on `skills` and `agents`.
- Must create `seed_default_org` RPC.
- Refactor client-side auto-seeding.

## Current Parent
- Conversation ID: 5fe64253-845f-47e1-9403-25a57b21b2ec
- Updated: 2026-07-21T22:30:00+07:00

## Task Summary
- **What to build**: DB migration for unique constraints + `seed_default_org` RPC, refactor `agentStore.ts` to use RPC and fix realtime handlers. Update `scripts/reseed_org.ts`.
- **Success criteria**: Auto-seeding works via RPC securely and atomically.
- **Interface contracts**: `supabase/migrations`, `src/store/agentStore.ts`, `scripts/reseed_org.ts`.
- **Code layout**: [TBD]

## Key Decisions Made
- [TBD]

## Artifact Index
- [TBD]

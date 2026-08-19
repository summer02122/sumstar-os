Last visited: 2026-07-21T22:31:00+07:00

- Created migration file `supabase/migrations/01_seed_org_rpc.sql` with UNIQUE constraints and `seed_default_org` RPC.
- Refactored `src/store/agentStore.ts` to replace client-side seeding with a call to the RPC.
- Updated `initialize` signature and real-time watchers.
- Updated `scripts/reseed_org.ts` to call the new RPC.
- Started `npm run build` to verify changes.
- Generated `handoff.md` with implementation details.

# Scope: DB Schema & RLS

## Architecture
- **Supabase DB (`chat_messages` table)**: Stores `id`, `user_id`, `agent_id`, `message`, `created_at`.
- **RLS**: Policies to ensure users can only SELECT, INSERT, UPDATE, DELETE their own chats (where `user_id = auth.uid()`).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Create SQL & Apply | Create `supabase_chat_messages.sql` and apply to Supabase DB if possible. | none | DONE |

## Interface Contracts
- `supabase_chat_messages.sql` should be at project root.

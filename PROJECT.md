# Project: SumStar OS Direct Chat Feature
# Scope: Global Implementation

## Architecture
- **Supabase DB (`chat_messages` table)**: Stores user_id, agent_id, message, created_at. Requires RLS policies so users only see their own chats.
- **RAG & Agent Persona Logic**: Update `/api/chat` or similar Next.js backend endpoint to fetch agent personas, query vector DB for context, pull AI keys from user settings, and stream response.
- **UI (`/chat` page & UI components)**: "The Core Ops" card grid for agent selection (SUM, SATIN, SINCARE). Full-screen chat interface.
- **Testing**: `scripts/test_chat.ts` verification script.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | DB Schema & RLS | Create `supabase_chat_messages.sql` to add `chat_messages` table and RLS policies. Apply to DB. | none | DONE |
| 2 | Backend Chat Logic | Implement API for Agent Persona adoption, AI key retrieval, contextual memory generation. | M1 | IN_PROGRESS |
| 3 | Chat UI with Cards | Rebuild `/chat` UI with agent cards, chat view, and "Clear Chat" button. | M2 | PLANNED |
| 4 | Final E2E Pass | Pass the E2E verification script `scripts/test_chat.ts`. | M3 | PLANNED |

## Interface Contracts
### API ↔ Supabase
- The chat API must save messages and read history from the `chat_messages` table using the user's authenticated Supabase client.
### UI ↔ API
- Client uses streaming responses for the typing indicator.

## Code Layout
- Frontend: `src/app/chat/page.tsx`, `src/components/`
- Backend: `src/app/api/`
- DB: `supabase_*.sql` files at root
- Scripts: `scripts/`

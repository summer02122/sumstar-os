# Scope: Milestone 2: Backend Chat Logic

## Architecture
- `src/lib/ai/provider.ts`: Add `streamText` method for Gemini and OpenAI streaming.
- `src/app/api/chat/route.ts`: Update to stream the response back to the client.
- `src/app/api/chat/route.ts`: Save the user message to `chat_messages` table before generating text.
- `src/app/api/chat/route.ts`: Save the assistant message to `chat_messages` table after generation is complete.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Backend Chat Logic | Implement API for Agent Persona adoption, AI key retrieval, contextual memory generation, message saving to DB, and streaming responses. | none | IN_PROGRESS |

## Interface Contracts
### API ↔ Supabase
- The chat API must save messages to `chat_messages` table using the user's authenticated Supabase client.
- Must save `user_id`, `agent_id`, `message` (content), `role` (user/assistant) - wait, check table schema!

### UI ↔ API
- Client uses streaming responses for the typing indicator (ReadableStream of text).

## Code Layout
- Backend: `src/app/api/chat/route.ts`
- AI Provider: `src/lib/ai/provider.ts`

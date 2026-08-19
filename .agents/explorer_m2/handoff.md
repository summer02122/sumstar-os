# Handoff Report: Milestone 2 Analysis & Strategy

## 1. Observation
- The DB schema for chat messages (`supabase_chat_messages.sql`) contains: `id`, `user_id`, `agent_id`, `message` (TEXT), and `created_at`. It lacks a `role` column.
- The `src/app/api/chat/route.ts` API route currently parses history but resolves with a blocking standard JSON response (`return new Response(JSON.stringify({ result: text }))`).
- `src/lib/ai/provider.ts` only exports standard blocking methods (`generateText`, `generateJSON`, `generateEmbedding`). It relies on standard `@google/generative-ai` and `openai` clients.
- `package.json` does not include the Vercel `ai` SDK package.

## 2. Logic Chain
- **Storage Question:** Because there is no `role` column in the schema, distinguishing between `user` and `assistant` messages is impossible if only plain text is stored in `message`. Thus, storing a JSON string (e.g., `{"role": "user", "content": "..."}`) in the `message` column is functionally required and the correct approach unless a DB migration is preferred.
- **Streaming Strategy:**
  1. **Provider Update:** We must introduce a `streamText` method in `AIProvider` that utilizes `model.generateContentStream()` for Gemini and `openai.chat.completions.create({ stream: true })` for OpenAI, yielding chunks.
  2. **API Route Update:** In `src/app/api/chat/route.ts`:
     - Save the user's incoming message to Supabase (`chat_messages`) immediately before calling the AI.
     - Call the new `streamText` method.
     - Pipe the chunks into a `ReadableStream` to return `text/event-stream` to the client.
     - **Critically:** While piping chunks to the stream, aggregate the text on the server. When the stream completes, insert the final synthesized AI message into `chat_messages`.

## 3. Caveats
- The current `tryGeminiModels` fallback logic in `provider.ts` catches errors after request initiation. For streams, error handling is trickier since a stream might fail mid-transmission. Fallbacks should only happen on initialization failures.
- No Vercel `ai` SDK means we must handle raw Web Streams (`ReadableStream` / `TransformStream`) manually in the route.

## 4. Conclusion
- **DB Storage:** Store messages as JSON strings: `JSON.stringify({ role, content })` in the `message` column.
- **Streaming Fix Strategy:**
  - Implement `streamText` in `provider.ts` returning an async iterable or stream.
  - In `route.ts`, save the user message to Supabase -> start stream -> return HTTP stream response -> on stream completion, save assistant message to Supabase.

## 5. Verification Method
- **Verification Command:** `npm run build` and run `scripts/test_chat.ts`.
- **Manual Verification:** Open the app, chat with an agent. Verify typing indicator appears progressively and check the Supabase dashboard to ensure both user and assistant messages appear as JSON strings in the `chat_messages` table.

## Review Summary

**Verdict**: REQUEST_CHANGES

## Findings

### [Critical] Interface Conformance: Frontend Expects JSON, Backend Returns Stream
- **What**: The backend `POST /api/chat` was modified to return a readable stream (`Content-Type: text/event-stream`). However, the frontend (`src/app/chat/page.tsx` line 130) is still using `await res.json()` and expects a JSON response containing `{"result": "..."}` or `{"error": "..."}`.
- **Where**: `src/app/api/chat/route.ts` vs `src/app/chat/page.tsx`
- **Why**: This mismatch breaks the chat functionality completely. `res.json()` will throw a `SyntaxError` when it encounters the raw streamed text.
- **Suggestion**: The frontend must be updated to consume the stream (e.g., using `res.body.getReader()`), or the backend must revert to JSON (which violates the milestone requirement to stream responses). Since the requirement is to stream, the frontend needs to be updated.

### [Critical] Streaming Issue: Loss of TextDecoder State for Multi-byte Characters
- **What**: `TransformStream` in `route.ts` creates a new `TextDecoder` instance on every chunk: `new TextDecoder().decode(chunk, { stream: true })`.
- **Where**: `src/app/api/chat/route.ts` (inside `transform` function)
- **Why**: This destroys the state required to decode multi-byte characters (like Thai characters or emojis) that happen to be split across chunk boundaries, resulting in malformed characters ().
- **Suggestion**: Instantiate `const decoder = new TextDecoder();` once outside the `TransformStream`, and use `decoder.decode(chunk, { stream: true })` inside the loop.

### [Major] Edge Case: Crash on Empty Messages Array
- **What**: Accessing `lastMessage.content` assumes the `messages` array is never empty.
- **Where**: `src/app/api/chat/route.ts` (line 94: `const lastMessage = messages[messages.length - 1]; const userPrompt = ... lastMessage.content`)
- **Why**: If the API is called with an empty `messages` array, this will throw a `TypeError: Cannot read properties of undefined (reading 'content')` and return an unhandled 500 error.
- **Suggestion**: Add a validation check: `if (!messages || messages.length === 0) return new Response(JSON.stringify({error: "Messages required"}), {status: 400});`

### [Major] Edge Case: Streaming Fallback in AIProvider
- **What**: `tryGeminiModels` only catches errors during stream *creation*, not during stream *consumption*.
- **Where**: `src/lib/ai/provider.ts` (line 167)
- **Why**: If the Gemini model starts streaming but then fails midway (e.g., rate limit, content filter), the error is caught by the inner `catch` block and passed to `controller.error(e)`. The `tryGeminiModels` fallback loop won't see this error, so it won't try the next model. 
- **Suggestion**: Document this limitation or buffer the first few chunks before returning the stream.

## Verified Claims
- The code builds successfully: Verified via `npm run build` -> Passed.
- Saves messages to Supabase as JSON strings: Verified in `route.ts` (`message: JSON.stringify({ role: 'assistant', content: fullText })`). -> Passed.

## Verification Method
1. Read `src/app/chat/page.tsx` line 139 to see `await res.json()`.
2. Inspect `route.ts` `TransformStream` implementation to verify `new TextDecoder()` inside the `transform` loop.
3. Call `POST /api/chat` with empty `messages: []` to trigger the TypeError.

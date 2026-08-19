# Handoff Report: Empirical Challenge of Milestone 2

## Observation
1. In `src/app/api/chat/route.ts`, the streaming logic pipes the text stream from `AIProvider` directly into the HTTP response:
   ```typescript
   const responseStream = stream.pipeThrough(transformStream);
   return new Response(responseStream, { headers: { 'Content-Type': 'text/event-stream' } ... });
   ```
   This means the response body contains raw text bytes (e.g., "Hello world!").

2. In `src/app/chat/page.tsx` (lines 130-142), the client consumes this response assuming it is a JSON object:
   ```typescript
   const data = await res.json();
   const agentMsg: Message = { role: "agent", content: data.result ?? ... };
   ```

3. I wrote a generator/oracle in `.agents/empirical_challenger/stream_oracle.ts` that simulates this exact `TransformStream` and client `Response.json()` behavior. 
4. The execution of the oracle (`npx tsx .agents/empirical_challenger/stream_oracle.ts`) resulted in:
   ```
   Client side error when parsing response: Unexpected token 'H', "Hello world!" is not valid JSON
   ```

## Logic Chain
- The client in `page.tsx` makes a POST request to `/api/chat` and explicitly awaits `res.json()`.
- The `/api/chat` endpoint stream does NOT encode chunks into JSON format, nor does it buffer the response into a JSON object. Instead, it streams raw raw chunks using `TextEncoder` in `AIProvider`.
- When the Next.js client receives the raw stream, `res.json()` attempts to parse the raw text. Since AI models typically respond with conversational text (not JSON, unless instructed), parsing will crash with a `SyntaxError`.
- The chat UI will silently fail or fall into the `catch` block which pushes an error message to the chat: `⚠️ Failed to connect to agent. Please try again.`
- Consequently, the core feature of chatting with the AI agents in Milestone 2 is completely broken.

## Caveats
- I did not test the actual Vercel Edge Runtime environment, but this bug is fundamentally about HTTP protocol and payload format mismatch, which is environment-agnostic.
- The `flush()` callback in `TransformStream` for database interaction is synchronously blocking the stream close, which avoids race conditions in Node.js runtime, so that part is technically functioning as intended.

## Conclusion
The Milestone 2 implementation is critically flawed. The client expects a JSON response, but the server implements raw text streaming. This hard mismatch causes an immediate `SyntaxError` on the client. To fix this, either the server must aggregate the stream and return JSON (disabling streaming), or the client must be refactored to consume a standard `ReadableStream` instead of calling `res.json()`.

## Verification Method
Run the following script to reproduce the failure mode:
`npx tsx .agents/empirical_challenger/stream_oracle.ts`
Alternatively, attempt to send any message in the Chat UI and observe the console for JSON parsing errors.

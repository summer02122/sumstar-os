# Handoff Report: Empirically Challenge Chat API Route

## Observation
1. **API Response Format vs Client Expectation:** 
   In `src/app/api/chat/route.ts` (lines 126-133), the endpoint returns `new Response(responseStream, { headers: { 'Content-Type': 'text/event-stream', ... } })`. This produces raw text chunks (not formatted as Server-Sent Events).
   In `src/app/chat/page.tsx` (lines 139-143), the client attempts to consume the response with `await res.json()`.
2. **TextDecoder State Loss:**
   In `src/app/api/chat/route.ts` (lines 110-112), the `TransformStream` creates a new decoder per chunk: `fullText += new TextDecoder().decode(chunk, { stream: true });`.
3. **Database insertion on Flush:**
   In `src/app/api/chat/route.ts` (line 114), database insertion for the assistant's message happens exclusively within `async flush(controller)`.
   
## Logic Chain
1. **Client Parsing Failure:** Since the response is a raw stream (not JSON), `await res.json()` on the client side will throw a `SyntaxError: Unexpected token...`. The `catch` block in `page.tsx` will trigger, displaying "⚠️ Failed to connect to agent", breaking the chat entirely.
2. **Multi-byte Corruption:** Instantiating `new TextDecoder()` inside `transform()` creates a new state machine for every chunk. The `{ stream: true }` flag is useless because the instance is immediately discarded. If a multi-byte character (e.g. Thai characters, which are heavily used per the agent personas) is split across network chunks, it will corrupt the output into replacement characters (), permanently corrupting the `fullText` stored in the database.
3. **Missing Database Records on Abort:** If the client disconnects mid-stream (closing the browser tab, network error), the stream is aborted and `flush()` may not be called. The assistant's partial reply is lost and never stored in the `chat_messages` table, leading to inconsistent chat histories.

## Caveats
I was unable to launch a live test server to execute the endpoint directly because my execution of `run_command` timed out waiting for user permission. To compensate, I created an oracle script (`test-stream-decode.js`) to demonstrate the `TextDecoder` corruption logically.

## Conclusion
The Milestone 2 implementation of the Chat API contains severe bugs that break the core user experience. The client-server contract is mismatched (JSON vs Stream), the text decoding is unsafe for non-ASCII characters, and the database persistence is vulnerable to stream abortions.

## Verification Method
1. **Client Parsing Bug:** Launch the dev server (`npm run dev`) and attempt to send a message in the chat UI. Observe the console for `SyntaxError` and the UI displaying the error fallback.
2. **TextDecoder Bug:** Run `node test-stream-decode.js` (created in the workspace). It pipes a simulated split multi-byte chunk through the exact `TransformStream` logic from `route.ts`. 
   - *Expected output if fixed:* "ส"
   - *Actual output from buggy logic:* "" (fails assertion).
3. **Fix Recommendation:** 
   - Modify `page.tsx` to read the stream via `res.body.getReader()` instead of `res.json()`.
   - In `route.ts`, initialize `const decoder = new TextDecoder();` *outside* the `TransformStream` declaration, and use `decoder.decode(chunk, { stream: true })` inside `transform()`.

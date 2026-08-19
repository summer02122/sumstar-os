# Handoff Report: Backend Chat Logic Fixes

## 1. Observation
- **Client/Server Mismatch**: `src/app/chat/page.tsx:139` calls `await res.json()`, but `src/app/api/chat/route.ts:126` returns a stream with `Content-Type: text/event-stream`.
- **Multi-byte Corruption**: `src/app/api/chat/route.ts:111` instantiates `new TextDecoder()` inside the `transform` function. This causes multi-byte characters split across chunks to be decoded incorrectly.
- **Empty Messages Array Crash**: `src/app/api/chat/route.ts:94` accesses `messages[messages.length - 1]` without checking if `messages` is empty. If empty, it leads to undefined errors.
- **Data Loss on Disconnect**: `src/app/api/chat/route.ts:114` handles saving the generated text in the `flush` function. If the client disconnects before the stream finishes, `flush` is not called, and the AI's partial response is lost.

## 2. Logic Chain
1. To fix the client/server mismatch, `page.tsx` must be updated to read the stream chunk by chunk using a `TextDecoder` and a `ReadableStreamDefaultReader` instead of parsing JSON.
2. Moving `const decoder = new TextDecoder();` outside the `TransformStream` in `route.ts` ensures that incomplete multi-byte characters are buffered and properly decoded when the rest of the bytes arrive in subsequent chunks.
3. Adding a guard clause `if (!messages || messages.length === 0)` returning a 400 response prevents the crash caused by accessing negative indices.
4. Listening to `req.signal.onabort` or passing an abort listener to save the `fullText` ensures that even partial responses are stored in Supabase if the client abruptly disconnects.

## 3. Caveats
- Next.js `req.signal.addEventListener('abort', ...)` behavior can sometimes be flaky across different deployment environments, but it is the standard way to detect client disconnection. Care should be taken to avoid duplicate database inserts if both `flush` and `abort` happen simultaneously, although usually only one occurs. We can use a `let isSaved = false;` flag to ensure the message is only saved once.

## 4. Conclusion
We should implement the following changes:

**For `src/app/api/chat/route.ts`:**
1. Check for empty messages:
   ```typescript
   if (!messages || messages.length === 0) {
     return new Response(JSON.stringify({ error: 'Messages cannot be empty' }), { status: 400 });
   }
   ```
2. Move `TextDecoder` outside:
   ```typescript
   const decoder = new TextDecoder();
   let fullText = '';
   let isSaved = false;

   const saveMessage = async () => {
     if (isSaved || !fullText) return;
     isSaved = true;
     await supabase.from('chat_messages').insert({
       agent_id: agentId,
       user_id: user.id,
       message: JSON.stringify({ role: 'assistant', content: fullText })
     });
   };
   ```
3. Update `TransformStream`:
   ```typescript
   const transformStream = new TransformStream({
     transform(chunk, controller) {
       fullText += decoder.decode(chunk, { stream: true });
       controller.enqueue(chunk);
     },
     async flush(controller) {
       fullText += decoder.decode();
       await saveMessage();
     }
   });
   ```
4. Listen for abort:
   ```typescript
   req.signal.addEventListener('abort', () => {
     saveMessage();
   });
   ```

**For `src/app/chat/page.tsx`:**
Replace `const data = await res.json();` with stream reading logic:
```javascript
      if (!res.body) throw new Error("No body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let text = "";

      // Pre-add empty agent message
      setChatHistory((prev) => ({
        ...prev,
        [agentId]: [
          ...(prev[agentId] ?? []),
          { role: "agent", content: "" },
        ],
      }));

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          text += decoder.decode(value, { stream: true });
          setChatHistory((prev) => {
            const history = prev[agentId] ?? [];
            const lastMsg = history[history.length - 1];
            return {
              ...prev,
              [agentId]: [
                ...history.slice(0, -1),
                { ...lastMsg, content: text },
              ],
            };
          });
        }
      }
```

## 5. Verification Method
- Ensure the project builds successfully (`npm run build`).
- Manually test chatting with an agent to ensure responses stream correctly without multi-byte character corruption.
- Simulate disconnecting (e.g. closing the browser tab mid-generation) and check Supabase to confirm the partial message was saved.
- Send an empty message array and verify it safely returns a 400 error rather than crashing the server.

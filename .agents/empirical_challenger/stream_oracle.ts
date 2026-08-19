import { TransformStream } from 'node:stream/web';
import { ReadableStream } from 'node:stream/web';

async function runTest() {
  // Simulate AIProvider.streamText
  const aiStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("Hello "));
      controller.enqueue(new TextEncoder().encode("world!"));
      controller.close();
    }
  });

  let fullText = '';
  // Simulate the exact TransformStream from route.ts
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      fullText += new TextDecoder().decode(chunk, { stream: true });
      controller.enqueue(chunk);
    },
    async flush(controller) {
      fullText += new TextDecoder().decode();
      console.log("[Mock Supabase Insert] fullText:", fullText);
    }
  });

  const responseStream = aiStream.pipeThrough(transformStream);
  
  // Now simulate the client in page.tsx
  // The server returns a Response wrapping responseStream
  const response = new Response(responseStream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' }
  });

  console.log("Simulating client await res.json()...");
  try {
    const data = await response.json();
    console.log("Success:", data);
  } catch (error) {
    console.error("Client side error when parsing response:", error.message);
  }
}

runTest();

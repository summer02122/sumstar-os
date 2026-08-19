const { ReadableStream, TransformStream } = require('stream/web');

async function runTest() {
  // Simulate a stream that splits a Thai character (สวัสดี - 'ส' is E0 B8 2A)
  // Let's use a 3-byte UTF-8 character split into two chunks
  // 'ส' is \u0e2a -> UTF-8: E0 B8 AA
  const chunk1 = new Uint8Array([0xE0, 0xB8]);
  const chunk2 = new Uint8Array([0xAA]);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(chunk1);
      controller.enqueue(chunk2);
      controller.close();
    }
  });

  let fullText = '';
  
  // This simulates the exact logic in route.ts
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      // Re-instantiating TextDecoder on every chunk
      fullText += new TextDecoder().decode(chunk, { stream: true });
      controller.enqueue(chunk);
    },
    async flush(controller) {
      fullText += new TextDecoder().decode();
    }
  });

  const responseStream = stream.pipeThrough(transformStream);
  
  const reader = responseStream.getReader();
  while (true) {
    const { done } = await reader.read();
    if (done) break;
  }

  console.log("Expected: ส");
  console.log("Actual  :", fullText);
  if (fullText !== 'ส') {
    console.error("FAIL: Stream decoding corrupted multi-byte characters.");
    process.exit(1);
  } else {
    console.log("PASS: Stream decoding worked.");
    process.exit(0);
  }
}

runTest().catch(console.error);

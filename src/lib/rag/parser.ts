export function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  if (!text) return [];

  const chunks: string[] = [];
  // Split by paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (trimmed.length === 0) continue;
    
    if (trimmed.length <= maxChunkSize) {
      chunks.push(trimmed);
    } else {
      // Split by single newline
      const lines = trimmed.split('\n');
      let currentChunk = '';
      
      for (const line of lines) {
        if (currentChunk.length + line.length + 1 <= maxChunkSize) {
           currentChunk += (currentChunk ? '\n' : '') + line;
        } else {
           if (currentChunk) {
               chunks.push(currentChunk);
           }
           
           if (line.length > maxChunkSize) {
              // chunk by maxChunkSize
              let start = 0;
              while (start < line.length) {
                 chunks.push(line.slice(start, start + maxChunkSize));
                 start += maxChunkSize;
              }
              currentChunk = '';
           } else {
              currentChunk = line;
           }
        }
      }
      if (currentChunk) chunks.push(currentChunk);
    }
  }

  // Merge smaller consecutive chunks if they fit within maxChunkSize
  const mergedChunks: string[] = [];
  let currentMerged = '';
  
  for (const chunk of chunks) {
    if (!currentMerged) {
      currentMerged = chunk;
    } else if (currentMerged.length + chunk.length + 2 <= maxChunkSize) {
      currentMerged += '\n\n' + chunk;
    } else {
      mergedChunks.push(currentMerged);
      currentMerged = chunk;
    }
  }
  
  if (currentMerged) {
    mergedChunks.push(currentMerged);
  }
  
  return mergedChunks;
}

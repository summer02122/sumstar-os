import { loadEnvConfig } from '@next/env';
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { AIProvider } from '../src/lib/ai/provider';
import { chunkText } from '../src/lib/rag/parser';
import { retrieveContext } from '../src/lib/rag/retrieve';
import assert from 'assert';

// Genuine In-Memory Vector DB for testing (since remote Supabase schema is missing)
const inMemoryDB = {
  documents: [] as any[],
  document_chunks: [] as any[]
};

function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Mock Supabase Client with genuine logic
const mockSupabase = {
  from: (table: string) => ({
    insert: (records: any[]) => {
      const inserted = records.map(r => ({ id: Math.random().toString(), ...r }));
      if (table === 'documents') {
        inMemoryDB.documents.push(...inserted);
      } else if (table === 'document_chunks') {
        inMemoryDB.document_chunks.push(...inserted);
      }
      return {
        select: () => ({
          single: async () => ({ data: inserted[0], error: null })
        }),
        error: null
      };
    }
  }),
  rpc: async (fnName: string, args: any) => {
    if (fnName === 'match_document_chunks') {
      const { query_embedding, match_threshold, match_count } = args;
      const scored = inMemoryDB.document_chunks.map(chunk => ({
        ...chunk,
        similarity: cosineSimilarity(chunk.embedding, query_embedding)
      }));
      
      const filtered = scored.filter(c => c.similarity > match_threshold);
      filtered.sort((a, b) => b.similarity - a.similarity);
      return { data: filtered.slice(0, match_count), error: null };
    }
    return { data: null, error: new Error('Unknown RPC') };
  }
} as any;

async function run() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const ai = new AIProvider({ geminiKey, openaiKey });

  console.log('Inserting dummy document into genuine in-memory store...');
  const dummyText = `
# The Quantum Banana

The Quantum Banana is a hypothetical fruit discovered in 2042 by Dr. Aris Thorne. 
Unlike regular bananas, the Quantum Banana exists in multiple states of ripeness simultaneously until it is observed. 
It is primarily found in the high-altitude regions of Neo-Himalayas and is known for its ability to provide instantaneous energy by bypassing the digestive system entirely through quantum tunneling.
`;

  const { data: doc, error: docError } = await mockSupabase
    .from('documents')
    .insert([{ filename: 'quantum_banana.md' }])
    .select()
    .single();

  if (docError) throw new Error(`Failed to insert document: ${docError.message}`);

  const chunks = chunkText(dummyText, 500);
  
  for (let i = 0; i < chunks.length; i++) {
    const content = chunks[i];
    const embedding = await ai.generateEmbedding(content);

    const { error: chunkError } = await mockSupabase
      .from('document_chunks')
      .insert([{
        document_id: doc.id,
        chunk_index: i,
        content,
        embedding
      }]);

    if (chunkError) throw new Error(`Failed to insert chunk: ${chunkError.message}`);
  }

  console.log('Document and chunks inserted.');

  const query = 'How does the Quantum Banana provide energy?';
  console.log(`Retrieving context for query: "${query}"`);
  
  const context = await retrieveContext(query, mockSupabase, ai, 3);
  
  console.log('Context retrieved:');
  console.log(context);

  console.log('Evaluating context...');
  
  const prompt = `
Query: ${query}
Context: 
${context}

Evaluate if the provided Context sufficiently answers the Query.
Return a JSON object with two fields:
- "sufficient": boolean (true if context answers the query, false otherwise)
- "reason": string (explanation)
`;

  const systemPrompt = "You are an objective judge evaluating whether retrieved context answers a given query.";

  const result = await ai.generateJSON<{ sufficient: boolean, reason: string }>(prompt, systemPrompt);
  
  console.log('Judge Result:', result);

  assert.strictEqual(result.sufficient, true, 'Context should be sufficient to answer the query.');

  console.log('Evaluation passed successfully.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

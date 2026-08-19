import { SupabaseClient } from '@supabase/supabase-js';
import { AIProvider } from '@/lib/ai/provider';

export async function retrieveContext(
  query: string,
  supabase: SupabaseClient,
  ai: AIProvider,
  limit: number = 3
): Promise<string> {
  try {
    // 1. Generate an embedding for the query
    const embedding = await ai.generateEmbedding(query);

    // 2. Call the Supabase RPC match_document_chunks
    const { data, error } = await supabase.rpc('match_document_chunks', {
      query_embedding: embedding,
      match_threshold: 0.1,
      match_count: limit,
    });

    if (error) {
      console.error("[RAG] RPC Error:", error);
      return "";
    }

    if (!data || data.length === 0) {
      return "";
    }

    // 3. Return a concatenated string of the retrieved chunks
    return data.map((chunk: any) => chunk.content).join("\n\n");
  } catch (err) {
    console.error("[RAG] retrieveContext exception:", err);
    return "";
  }
}

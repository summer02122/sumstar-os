import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { AIProvider } from '@/lib/ai/provider';
import { chunkText } from '@/lib/rag/parser';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      return NextResponse.json({ error: "Only .txt and .md files are supported" }, { status: 400 });
    }

    const text = await file.text();
    const chunks = chunkText(text, 1000);

    const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
    
    if (!settings || (!settings.openai_api_key && !settings.gemini_api_key)) {
      return NextResponse.json({ error: "No AI API keys configured. Please add them in Settings." }, { status: 400 });
    }

    const ai = new AIProvider({
      geminiKey: settings.gemini_api_key,
      openaiKey: settings.openai_api_key
    });

    // Insert into documents table
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        filename: file.name,
        user_id: user.id
      })
      .select('id')
      .single();

    if (docError) {
      throw new Error(`Failed to insert document: ${docError.message}`);
    }

    // Process chunks and embeddings
    const chunksToInsert = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i];
      const embedding = await ai.generateEmbedding(chunkContent);
      
      chunksToInsert.push({
        document_id: document.id,
        chunk_index: i,
        content: chunkContent,
        embedding: embedding
      });
    }

    // Insert chunks
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(chunksToInsert);

    if (chunksError) {
      throw new Error(`Failed to insert document chunks: ${chunksError.message}`);
    }

    return NextResponse.json({ success: true, documentId: document.id, chunksProcessed: chunksToInsert.length });

  } catch (error: any) {
    console.error("[API] RAG Upload Error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred during upload." }, { status: 500 });
  }
}

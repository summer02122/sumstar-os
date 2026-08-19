-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector with schema extensions;

-- Create documents table
create table if not exists documents (
    id uuid primary key default gen_random_uuid(),
    filename text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create document_chunks table
create table if not exists document_chunks (
    id uuid primary key default gen_random_uuid(),
    document_id uuid references documents(id) on delete cascade not null,
    chunk_index integer not null,
    content text not null,
    embedding vector
);

-- Create an index on the document_id for faster lookups
create index if not exists document_chunks_document_id_idx on document_chunks(document_id);

-- Create a function to search for documents
create or replace function match_document_chunks (
  query_embedding vector,
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;

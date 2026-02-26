-- Allow RPC to be called with text embedding (PostgREST doesn't pass vector type directly).
-- Replace match_knowledge_base to accept text and cast to vector.
create or replace function match_knowledge_base(
  query_embedding text,
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  content text,
  source_type text,
  similarity float
)
language sql
stable
as $$
  select
    id,
    title,
    content,
    source_type,
    1 - (ai_knowledge_base.embedding <=> query_embedding::vector(1536)) as similarity
  from ai_knowledge_base
  where ai_knowledge_base.embedding is not null
    and 1 - (ai_knowledge_base.embedding <=> query_embedding::vector(1536)) > match_threshold
  order by (ai_knowledge_base.embedding <=> query_embedding::vector(1536)) asc
  limit match_count;
$$;

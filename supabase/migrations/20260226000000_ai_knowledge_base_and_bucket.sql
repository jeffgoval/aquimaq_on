-- =============================================================================
-- RAG: Tabela ai_knowledge_base com vetores (embedding 1536) e bucket knowledge-base
-- =============================================================================

-- 1. Extensão pgvector (necessária para vector(1536))
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Tabela ai_knowledge_base (embedding = text-embedding-3-small → 1536 dimensões)
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  source_type text NOT NULL DEFAULT 'document',
  embedding extensions.vector(1536),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para busca por similaridade (cosine distance)
CREATE INDEX IF NOT EXISTS ai_knowledge_base_embedding_idx
  ON public.ai_knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 3. Função RPC para busca semântica (usada pela Edge Function ai-chat)
CREATE OR REPLACE FUNCTION public.match_knowledge_base(
  query_embedding extensions.vector(1536),
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    akb.id,
    akb.title,
    akb.content
  FROM public.ai_knowledge_base akb
  WHERE akb.embedding IS NOT NULL
    AND (akb.embedding <=> query_embedding) < (1 - match_threshold)
  ORDER BY akb.embedding <=> query_embedding ASC
  LIMIT least(match_count, 200);
$$;

-- 4. Bucket "knowledge-base" no Storage
--    Crie manualmente no Dashboard: Storage → New bucket → id = "knowledge-base", público.
--    Ou via API: storage.createBucket('knowledge-base', { public: true }).

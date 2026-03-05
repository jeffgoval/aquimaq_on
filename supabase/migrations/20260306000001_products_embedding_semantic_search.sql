-- Coluna de embedding na tabela products para busca semântica (text-embedding-3-small = 1536 dimensões).
-- Permite encontrar produtos por significado (ex.: "máquina de café barata") mesmo sem a palavra no nome.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- RPC: busca semântica de produtos por similaridade ao embedding da pergunta.
-- Retorna produtos ativos que tenham embedding preenchido, ordenados por relevância.
CREATE OR REPLACE FUNCTION public.match_products_semantic(
  query_embedding extensions.vector,
  match_threshold double precision DEFAULT 0.5,
  match_count integer DEFAULT 25
)
RETURNS TABLE(id uuid, name text, price numeric, stock integer, category text)
LANGUAGE sql
STABLE
SET search_path TO public, extensions
AS $$
  SELECT
    p.id,
    p.name,
    p.price,
    p.stock,
    p.category
  FROM public.products p
  WHERE p.is_active = true
    AND p.embedding IS NOT NULL
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold
  ORDER BY p.embedding <=> query_embedding ASC
  LIMIT least(match_count, 50);
$$;

COMMENT ON COLUMN public.products.embedding IS 'Embedding OpenAI text-embedding-3-small (1536) para busca semântica no chat.';

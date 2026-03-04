-- Fix mutable search_path on all public functions (security hardening).
-- Pins search_path so it cannot be hijacked by a malicious schema injected earlier
-- in the search path. Vector functions include 'extensions' so the pgvector
-- <=> operator resolves correctly.

CREATE OR REPLACE FUNCTION public.ai_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.update_whatsapp_session_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_knowledge_base(
  query_embedding extensions.vector,
  match_threshold double precision DEFAULT 0.4,
  match_count integer DEFAULT 5
)
RETURNS TABLE(id uuid, title text, content text)
LANGUAGE sql
STABLE
SET search_path TO public, extensions
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

CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding extensions.vector,
  match_threshold double precision,
  match_count integer,
  diversity_penalty double precision DEFAULT 0.0
)
RETURNS TABLE(id uuid, title text, content text, source_type text, metadata jsonb, similarity double precision)
LANGUAGE sql
STABLE
SET search_path TO public, extensions
AS $$
  SELECT
    akb.id,
    akb.title,
    akb.content,
    akb.source_type,
    akb.metadata,
    1 - (akb.embedding <=> query_embedding) AS similarity
  FROM public.ai_knowledge_base akb
  WHERE akb.embedding IS NOT NULL
    AND 1 - (akb.embedding <=> query_embedding) > match_threshold
  ORDER BY (akb.embedding <=> query_embedding) ASC
  LIMIT match_count;
$$;

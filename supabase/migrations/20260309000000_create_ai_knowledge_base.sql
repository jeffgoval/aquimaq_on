-- Nota: product_documents deve existir (criada na migração create_product_documents_and_ai_knowledge_base).
-- Habilitar extensão pgvector (se ainda não existir).
create extension if not exists vector with schema extensions;

-- Tabela de chunks para RAG: bulas e manuais de máquinas.
-- Cada linha = um fragmento de texto + embedding para busca semântica.
create table if not exists public.ai_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  product_document_id uuid not null references public.product_documents(id) on delete cascade,
  product_id uuid not null,
  content text not null,
  embedding extensions.vector(1536) not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

comment on table public.ai_knowledge_base is 'Chunks de documentos (bulas, manuais) com embeddings para RAG do agente IA.';

-- Índice para busca por documento (listar/limpar chunks de um documento).
create index if not exists idx_ai_knowledge_base_product_document_id
  on public.ai_knowledge_base (product_document_id);

-- Índice para filtrar por produto na consulta do agente.
create index if not exists idx_ai_knowledge_base_product_id
  on public.ai_knowledge_base (product_id);

-- Índice vetorial para busca por similaridade (cosine distance).
-- 1536 = dimensão do OpenAI text-embedding-3-small / ada-002.
create index if not exists idx_ai_knowledge_base_embedding
  on public.ai_knowledge_base
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- RLS: apenas utilizadores autenticados podem ler (agente/backend usa service role ou anon com política).
alter table public.ai_knowledge_base enable row level security;

-- Política: leitura para utilizadores autenticados (ajustar conforme teu modelo de permissões).
create policy "Allow read ai_knowledge_base for authenticated"
  on public.ai_knowledge_base for select
  to authenticated
  using (true);

-- Inserção/atualização apenas via service role ou Edge Function (backend).
-- Se a Edge Function usar anon key com JWT, criar política para insert/update por backend.
create policy "Allow insert ai_knowledge_base for service role"
  on public.ai_knowledge_base for insert
  to service_role
  with check (true);

create policy "Allow delete ai_knowledge_base for service role"
  on public.ai_knowledge_base for delete
  to service_role
  using (true);

-- Função para o agente IA: busca por similaridade (cosine).
-- Uso: supabase.rpc('match_knowledge', { query_embedding: [...], match_count: 5, product_id: '...' })
create or replace function public.match_knowledge(
  query_embedding extensions.vector(1536),
  match_count int default 5,
  filter_product_id uuid default null
)
returns table (
  id uuid,
  product_document_id uuid,
  product_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    k.id,
    k.product_document_id,
    k.product_id,
    k.content,
    k.metadata,
    1 - (k.embedding <=> query_embedding) as similarity
  from public.ai_knowledge_base k
  where (filter_product_id is null or k.product_id = filter_product_id)
  order by k.embedding <=> query_embedding
  limit match_count;
$$;

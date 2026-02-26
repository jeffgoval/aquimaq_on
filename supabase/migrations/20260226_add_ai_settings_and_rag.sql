-- Enable pgvector extension
create extension if not exists vector
with schema extensions;

-- Create ai_settings table
create table public.ai_settings (
  id uuid not null default gen_random_uuid(),
  provider text not null default 'openai',
  api_key text not null,
  model text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ai_settings_pkey primary key (id)
);

-- Ensure only one row exists (id must be a specific UUID or we can just limit it)
-- We'll just rely on the application to update a single row, but let's add a trigger for updated_at
create trigger set_ai_settings_updated_at
before update on public.ai_settings
for each row
execute function moddatetime('updated_at');

-- Enable RLS
alter table public.ai_settings enable row level security;

-- Policies for ai_settings (only admins)
create policy "Admins can view ai_settings"
on public.ai_settings for select
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

create policy "Admins can insert ai_settings"
on public.ai_settings for insert
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

create policy "Admins can update ai_settings"
on public.ai_settings for update
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- Add embedding column to ai_knowledge_base
alter table public.ai_knowledge_base
add column embedding vector(1536);

-- Create an index for vector similarity search
create index on public.ai_knowledge_base
using hnsw (embedding vector_cosine_ops);

-- Create the match_knowledge_base function
create or replace function match_knowledge_base(
  query_embedding vector(1536),
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
    1 - (ai_knowledge_base.embedding <=> query_embedding) as similarity
  from ai_knowledge_base
  where 1 - (ai_knowledge_base.embedding <=> query_embedding) > match_threshold
  order by (ai_knowledge_base.embedding <=> query_embedding) asc
  limit match_count;
$$;

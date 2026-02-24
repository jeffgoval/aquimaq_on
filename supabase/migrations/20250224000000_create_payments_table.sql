-- Tabela para webhook Mercado Pago (upsert por external_id)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  order_id text not null default '',
  status text not null,
  amount numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

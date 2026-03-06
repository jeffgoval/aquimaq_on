-- Tabela de status do bot WhatsApp (heartbeat da VPS)
create table if not exists whatsapp_bot_status (
  id           text primary key default 'default',
  session_name text not null default 'aquimaq',
  status       text not null default 'disconnected', -- connected | disconnected | connecting
  phone_number text,
  last_seen    timestamptz,
  messages_today  integer default 0,
  handoffs_today  integer default 0,
  updated_at   timestamptz default now()
);

alter table whatsapp_bot_status enable row level security;

create policy "authenticated can read bot status"
  on whatsapp_bot_status for select to authenticated using (true);

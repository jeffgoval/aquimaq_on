-- n8n_webhook_logs: queue table for order event notifications
-- DB trigger notify_order_change() inserts rows here; n8n polls and processes them

CREATE TABLE IF NOT EXISTS public.n8n_webhook_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   text        NOT NULL,
  payload      jsonb,
  status       text        NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- RLS: only service_role (n8n Supabase node) can read/write
ALTER TABLE public.n8n_webhook_logs ENABLE ROW LEVEL SECURITY;

-- No explicit policies → anon and authenticated roles have no access
-- service_role bypasses RLS automatically in Supabase

-- Fast lookup for pending events (n8n polling query)
CREATE INDEX IF NOT EXISTS idx_n8n_webhook_logs_status_created
  ON public.n8n_webhook_logs (status, created_at)
  WHERE status = 'pending';

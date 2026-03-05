ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS me_order_id TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS shipping_status TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_me_order_id ON public.orders(me_order_id) WHERE me_order_id IS NOT NULL;

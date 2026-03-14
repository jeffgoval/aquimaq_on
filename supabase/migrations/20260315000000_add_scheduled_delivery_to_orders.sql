-- Suporte a entrega agendada (checkout já envia esses campos)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS scheduled_delivery_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_delivery_notes TEXT;

COMMENT ON COLUMN public.orders.scheduled_delivery_date IS 'Data prevista de entrega (ex: agendamento Melhor Envios)';
COMMENT ON COLUMN public.orders.scheduled_delivery_notes IS 'Observações de agendamento de entrega';

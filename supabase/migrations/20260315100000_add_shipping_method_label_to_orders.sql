-- Rótulo legível do método de envio (ex: "Jadlog - .Package") para exibição no admin.
-- O identificador técnico (me_1, pickup_store) fica em shipping_method.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_method_label TEXT;

COMMENT ON COLUMN public.orders.shipping_method_label IS 'Rótulo para exibição (ex: transportadora - serviço); shipping_method guarda o ID (me_X ou pickup_store).';

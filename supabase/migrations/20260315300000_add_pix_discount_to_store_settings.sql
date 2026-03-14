-- Adiciona pix_discount à store_settings para desconto PIX configurável via admin
-- Valor entre 0 e 1 (ex: 0.05 = 5%). Default 5%.

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS pix_discount NUMERIC(5,4) DEFAULT 0.05;

COMMENT ON COLUMN public.store_settings.pix_discount IS 'Percentual de desconto para pagamento via PIX. Valor de 0 a 1 (ex: 0.05 = 5%).';

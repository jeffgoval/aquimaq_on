-- Adiciona configurações de pagamento à tabela store_settings
-- max_installments: máximo de parcelas exibidas no checkout (1 a 12)
-- accepted_payment_types: quais tipos de pagamento aceitar
--   Valores MP válidos: "credit_card", "debit_card", "bank_transfer" (PIX), "ticket" (boleto)

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS max_installments integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS accepted_payment_types jsonb NOT NULL DEFAULT '["credit_card","debit_card","bank_transfer","ticket"]'::jsonb;

COMMENT ON COLUMN store_settings.max_installments IS 'Número máximo de parcelas permitidas no checkout Mercado Pago (1-12)';
COMMENT ON COLUMN store_settings.accepted_payment_types IS 'Tipos de pagamento aceitos: credit_card, debit_card, bank_transfer (PIX), ticket (boleto)';

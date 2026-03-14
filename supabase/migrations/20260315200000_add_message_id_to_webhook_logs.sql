-- Adiciona message_id para deduplicação de mensagens do Chat Bot n8n
-- Garante que a mesma mensagem do Chatwoot não seja processada duas vezes

ALTER TABLE public.n8n_webhook_logs
  ADD COLUMN IF NOT EXISTS message_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_n8n_webhook_logs_message_id
  ON public.n8n_webhook_logs (message_id)
  WHERE message_id IS NOT NULL;

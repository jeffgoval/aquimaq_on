-- Cart sessions: persiste o carrinho ativo por usuário autenticado.
-- Permite que automações (n8n) detectem carrinhos abandonados sem acesso ao localStorage.

CREATE TABLE IF NOT EXISTS public.cart_sessions (
  user_id                  uuid        NOT NULL PRIMARY KEY
                                       REFERENCES auth.users(id) ON DELETE CASCADE,
  items                    jsonb       NOT NULL DEFAULT '[]',
  subtotal                 numeric(10, 2) NOT NULL DEFAULT 0,
  item_count               integer     NOT NULL DEFAULT 0,
  updated_at               timestamptz NOT NULL DEFAULT now(),
  -- Preenchido pelo n8n após enviar notificação; evita renotificações em 24h
  abandonment_notified_at  timestamptz
);

ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado gerencia apenas o próprio carrinho
CREATE POLICY "cart_sessions_user_all"
  ON public.cart_sessions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role pode ler e escrever (para Edge Functions e n8n)
CREATE POLICY "cart_sessions_service_role"
  ON public.cart_sessions FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Trigger: mantém updated_at atualizado
CREATE TRIGGER set_cart_sessions_updated_at
  BEFORE UPDATE ON public.cart_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índice para a query de detecção de abandono (updated_at + item_count)
CREATE INDEX IF NOT EXISTS idx_cart_sessions_abandoned
  ON public.cart_sessions (updated_at, item_count)
  WHERE item_count > 0 AND abandonment_notified_at IS NULL;

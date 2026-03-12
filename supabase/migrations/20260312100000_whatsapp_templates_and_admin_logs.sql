-- whatsapp_templates: modelos de mensagem para submissão à Meta (templates aprovados)
-- O admin edita o texto aqui e usa para submeter ao Meta Business e para referência nos envios.

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text        NOT NULL UNIQUE,
  name          text        NOT NULL,
  body          text        NOT NULL,
  meta_status  text        NOT NULL DEFAULT 'rascunho' CHECK (meta_status IN ('rascunho', 'submetido', 'aprovado')),
  meta_notes    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.whatsapp_templates.slug IS 'Identificador único: cart_abandoned, order_follow_up, etc.';
COMMENT ON COLUMN public.whatsapp_templates.meta_status IS 'Rascunho / Submetido à Meta / Aprovado pela Meta';
COMMENT ON COLUMN public.whatsapp_templates.meta_notes IS 'Notas sobre submissão ou ID do template na Meta';

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_templates_admin_gerente_all"
  ON public.whatsapp_templates FOR ALL
  USING (public.is_admin_or_manager())
  WITH CHECK (public.is_admin_or_manager());

CREATE TRIGGER set_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Inserir templates padrão para cart_abandoned e order_follow_up
INSERT INTO public.whatsapp_templates (slug, name, body, meta_status)
VALUES
  ('cart_abandoned', 'Carrinho abandonado', 'Olá {{1}}, você deixou itens no carrinho. Volte para concluir sua compra: {{2}}', 'rascunho'),
  ('order_follow_up', 'Lembrete de pagamento', 'Olá {{1}}, o pedido #{{2}} está aguardando pagamento. Total: R$ {{3}}. Conclua em: {{4}}', 'rascunho')
ON CONFLICT (slug) DO NOTHING;

-- Permitir que admin/gerente leiam n8n_webhook_logs (apenas leitura para gestão no painel)
CREATE POLICY "n8n_webhook_logs_admin_gerente_select"
  ON public.n8n_webhook_logs FOR SELECT
  USING (public.is_admin_or_manager());

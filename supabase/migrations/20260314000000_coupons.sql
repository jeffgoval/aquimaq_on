-- Tabela de cupons de desconto
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  min_purchase_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_uses INTEGER,           -- NULL = ilimitado
  used_count INTEGER NOT NULL DEFAULT 0,
  expiration_date TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode ler cupons ativos (validação real ocorre na Edge Function)
CREATE POLICY "Anyone can read active coupons" ON public.coupons
  FOR SELECT
  USING (active = true);

-- Apenas service_role pode inserir/atualizar/deletar (admin via supabaseAdmin)
CREATE POLICY "Service role full access" ON public.coupons
  FOR ALL
  USING (auth.role() = 'service_role');

-- Adicionar colunas de cupom em orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id),
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0;

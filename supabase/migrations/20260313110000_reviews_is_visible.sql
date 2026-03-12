-- Permite ocultar avaliações na loja sem apagar (moderação admin).
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.reviews.is_visible IS 'Quando false, a avaliação não é exibida na página do produto.';

-- Admin/gerente podem atualizar is_visible (moderação).
CREATE POLICY "reviews_update_admin" ON public.reviews FOR UPDATE TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (true);

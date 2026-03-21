-- Adiciona campo SKU (Stock Keeping Unit) à tabela de produtos
-- O SKU é o código interno já usado na loja física

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku TEXT;

-- Índice único: dois produtos não podem ter o mesmo SKU (nulos são permitidos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku
  ON public.products (sku)
  WHERE sku IS NOT NULL;

-- Índice para buscas rápidas por SKU
CREATE INDEX IF NOT EXISTS idx_products_sku_search
  ON public.products (sku);

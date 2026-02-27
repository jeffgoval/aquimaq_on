-- Adiciona vendedor_id à tabela products
-- Produtos sem vendedor_id pertencem à loja (admin)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_vendedor_id ON products(vendedor_id);

-- Adiciona vendedor_id à tabela orders
-- Pedidos sem vendedor_id são da loja direta ou legados
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_vendedor_id ON orders(vendedor_id);

-- RLS: vendedor pode SELECT apenas seus próprios produtos (ou produtos sem vendedor)
DROP POLICY IF EXISTS "vendedor_select_own_products" ON products;
CREATE POLICY "vendedor_select_own_products"
  ON products FOR SELECT
  TO authenticated
  USING (
    vendedor_id = auth.uid()
    OR vendedor_id IS NULL
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'gerente')
  );

-- RLS: vendedor pode INSERT apenas seus próprios produtos
DROP POLICY IF EXISTS "vendedor_insert_own_products" ON products;
CREATE POLICY "vendedor_insert_own_products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    vendedor_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'gerente')
  );

-- RLS: vendedor pode UPDATE apenas seus próprios produtos
DROP POLICY IF EXISTS "vendedor_update_own_products" ON products;
CREATE POLICY "vendedor_update_own_products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    vendedor_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'gerente')
  );

-- RLS: vendedor pode SELECT apenas seus próprios pedidos
DROP POLICY IF EXISTS "vendedor_select_own_orders" ON orders;
CREATE POLICY "vendedor_select_own_orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    vendedor_id = auth.uid()
    OR vendedor_id IS NULL
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'gerente')
  );

-- RLS: vendedor pode UPDATE status/rastreio dos seus pedidos
DROP POLICY IF EXISTS "vendedor_update_own_orders" ON orders;
CREATE POLICY "vendedor_update_own_orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    vendedor_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'gerente')
  );

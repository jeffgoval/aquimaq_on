-- =============================================
-- FIX: Remover policies excessivamente permissivas
-- =============================================

-- ORDERS: todo autenticado via TODOS os pedidos (sobrescreve isolamento vendedor)
DROP POLICY IF EXISTS "orders_select_authenticated" ON public.orders;

-- ORDERS: cliente pode atualizar status do próprio pedido (perigoso)
DROP POLICY IF EXISTS "orders_update_self_or_admin" ON public.orders;

-- ORDERS: duplicata de orders_insert_own
DROP POLICY IF EXISTS "orders_insert_self" ON public.orders;

-- ORDER_ITEMS: todo autenticado vê TODOS os itens de todos os pedidos
DROP POLICY IF EXISTS "order_items_select_authenticated" ON public.order_items;

-- PAYMENTS: todo autenticado vê TODOS os pagamentos
DROP POLICY IF EXISTS "payments_select_authenticated" ON public.payments;

-- PROFILES: anônimo lê email/telefone/endereço de qualquer usuário
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;

-- PRODUCTS: todo autenticado pode alterar qualquer produto
DROP POLICY IF EXISTS "Permitir alteração apenas para autorizados" ON public.products;

-- =============================================
-- CRIAR policies corretas em substituição
-- =============================================

-- PROFILES: usuário vê apenas o próprio perfil (staff já coberto por profiles_select_staff)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ORDER_ITEMS: cliente vê itens dos próprios pedidos; staff vê todos
CREATE POLICY "order_items_select_own_or_staff"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.cliente_id = auth.uid() OR is_staff())
    )
  );

-- PAYMENTS: cliente vê pagamentos dos próprios pedidos; staff vê todos
CREATE POLICY "payments_select_own_or_staff"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payments.order_id
        AND (o.cliente_id = auth.uid() OR is_staff())
    )
  );

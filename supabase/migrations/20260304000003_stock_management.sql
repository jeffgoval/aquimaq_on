-- =============================================================================
-- Gestão de Estoque
-- =============================================================================
-- 1. Constraint: estoque nunca negativo
-- 2. decrement_stock_for_order(order_id) — chamado pelo webhook ao aprovar pagamento
-- 3. restore_stock_from_unpaid_orders()  — chamado pelo painel admin para restaurar
--    estoque de pedidos sem pagamento confirmado
-- =============================================================================

-- 1. Constraint: estoque não pode ser negativo
ALTER TABLE public.products
  ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);

-- 2. Decrementa estoque dos itens de um pedido de forma atômica.
--    Retorna erro se algum produto ficar com estoque negativo.
CREATE OR REPLACE FUNCTION public.decrement_stock_for_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  -- Percorre cada item do pedido e decrementa
  FOR r IN
    SELECT oi.product_id, oi.quantity
    FROM order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_id IS NOT NULL
  LOOP
    UPDATE products
    SET stock = stock - r.quantity,
        updated_at = now()
    WHERE id = r.product_id;

    -- A constraint products_stock_non_negative garante que stock >= 0.
    -- Se violar, a transação inteira é revertida automaticamente.
  END LOOP;
END;
$$;

-- 3. Restaura estoque de pedidos que nunca foram pagos.
--    Considera "não pago" todo pedido cujo status NÃO seja 'pago'.
--    Usa uma flag na tabela orders (stock_restored) para não restaurar duas vezes.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_restored boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.restore_stock_from_unpaid_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r       RECORD;
  restored integer := 0;
BEGIN
  -- Pedidos não pagos, com mais de 2 horas, cujo estoque ainda não foi restaurado
  FOR r IN
    SELECT DISTINCT oi.product_id, SUM(oi.quantity) AS qty, o.id AS order_id
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status != 'pago'
      AND o.stock_restored = false
      AND o.created_at < now() - interval '2 hours'
      AND oi.product_id IS NOT NULL
    GROUP BY oi.product_id, o.id
  LOOP
    UPDATE products
    SET stock = stock + r.qty,
        updated_at = now()
    WHERE id = r.product_id;

    UPDATE orders
    SET stock_restored = true
    WHERE id = r.order_id;

    restored := restored + 1;
  END LOOP;

  RETURN restored;
END;
$$;

-- 4. Flag de controle: marca pedido como tendo o estoque já decrementado,
--    para evitar duplo-decremento em caso de reenvio do webhook.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_decremented boolean NOT NULL DEFAULT false;

-- Permissões: apenas service role pode chamar essas funções
REVOKE ALL ON FUNCTION public.decrement_stock_for_order(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_stock_from_unpaid_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_stock_for_order(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_stock_from_unpaid_orders() TO service_role;
-- Painel admin chama via RPC autenticado
GRANT EXECUTE ON FUNCTION public.restore_stock_from_unpaid_orders() TO authenticated;

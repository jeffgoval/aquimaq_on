-- Corrige RLS de UPDATE na tabela orders para incluir vendedores.
--
-- Problema: orders_update_staff usava is_admin_or_manager(), que exclui a role
-- "vendedor". Pedidos com vendedor_id = NULL (ou de outro vendedor) causavam
-- update silencioso (0 rows, sem error) quando um vendedor tentava alterar o
-- status — a UI atualizava otimisticamente mas o banco mantinha o valor antigo.
--
-- Solução: substituir pela função is_staff(), que já inclui admin + gerente +
-- vendedor. A política vendedor_update_own_orders fica redundante e é removida.

DROP POLICY IF EXISTS "orders_update_staff" ON public.orders;
DROP POLICY IF EXISTS "vendedor_update_own_orders" ON public.orders;

-- Qualquer membro da equipe (vendedor, gerente, admin) pode atualizar qualquer
-- pedido da loja.
CREATE POLICY "orders_update_staff" ON public.orders
    FOR UPDATE
    TO authenticated
    USING (is_staff());

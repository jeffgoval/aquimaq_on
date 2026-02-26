-- ==============================================================================
-- Migration: Corrigir "RLS Policy Always True" no Linter (Fase 3)
-- ==============================================================================
-- O Linter do Supabase detectou várias tabelas com regras RLS (Row Level Security)
-- totalmente inseguras (ex: WITH CHECK (true) ou USING (true)) que permitiam que 
-- qualquer usuário logado apagasse/editasse dados um do outro e da loja.

-- Criaremos uma função auxiliar simples para evitar bloqueios ao verificar as RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('admin', 'gerente')
  );
$$;

-- ------------------------------------------------------------------------------
-- Módulo 1: Produtos e Banners (Leitura livre, Escrita/Update/Delete só por Admins)
-- ------------------------------------------------------------------------------
-- Tabela: products
DROP POLICY IF EXISTS products_insert_authenticated ON public.products;
DROP POLICY IF EXISTS products_update_authenticated ON public.products;
DROP POLICY IF EXISTS products_delete_authenticated ON public.products;

CREATE POLICY products_insert_admin ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY products_update_admin ON public.products FOR UPDATE USING (public.is_admin());
CREATE POLICY products_delete_admin ON public.products FOR DELETE USING (public.is_admin());

-- Tabela: banners
DROP POLICY IF EXISTS banners_insert_authenticated ON public.banners;
DROP POLICY IF EXISTS banners_update_authenticated ON public.banners;
DROP POLICY IF EXISTS banners_delete_authenticated ON public.banners;

CREATE POLICY banners_insert_admin ON public.banners FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY banners_update_admin ON public.banners FOR UPDATE USING (public.is_admin());
CREATE POLICY banners_delete_admin ON public.banners FOR DELETE USING (public.is_admin());

-- Tabela: product_documents
DROP POLICY IF EXISTS product_documents_insert_authenticated ON public.product_documents;
DROP POLICY IF EXISTS product_documents_update_authenticated ON public.product_documents;
DROP POLICY IF EXISTS product_documents_delete_authenticated ON public.product_documents;

CREATE POLICY product_documents_insert_admin ON public.product_documents FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY product_documents_update_admin ON public.product_documents FOR UPDATE USING (public.is_admin());
CREATE POLICY product_documents_delete_admin ON public.product_documents FOR DELETE USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- Módulo 2: Configurações da Loja e Log de Webhooks (Somente Leitura Geral/Escrita Admin)
-- ------------------------------------------------------------------------------
-- Tabela: store_settings
DROP POLICY IF EXISTS store_settings_insert_authenticated ON public.store_settings;
DROP POLICY IF EXISTS store_settings_update_authenticated ON public.store_settings;
DROP POLICY IF EXISTS store_settings_delete_authenticated ON public.store_settings;

CREATE POLICY store_settings_insert_admin ON public.store_settings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY store_settings_update_admin ON public.store_settings FOR UPDATE USING (public.is_admin());
CREATE POLICY store_settings_delete_admin ON public.store_settings FOR DELETE USING (public.is_admin());

-- Tabela: n8n_webhook_logs (Somente sistema deve inserir, admin pode ler. Para deletar/update, trancamos aqui)
DROP POLICY IF EXISTS n8n_webhook_logs_insert_authenticated ON public.n8n_webhook_logs;
DROP POLICY IF EXISTS n8n_webhook_logs_update_authenticated ON public.n8n_webhook_logs;
DROP POLICY IF EXISTS n8n_webhook_logs_delete_authenticated ON public.n8n_webhook_logs;

CREATE POLICY n8n_webhook_logs_insert_admin ON public.n8n_webhook_logs FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY n8n_webhook_logs_update_admin ON public.n8n_webhook_logs FOR UPDATE USING (public.is_admin());
CREATE POLICY n8n_webhook_logs_delete_admin ON public.n8n_webhook_logs FOR DELETE USING (public.is_admin());

-- Tabela: ai_knowledge_base
DROP POLICY IF EXISTS ai_knowledge_base_insert_authenticated ON public.ai_knowledge_base;
DROP POLICY IF EXISTS ai_knowledge_base_update_authenticated ON public.ai_knowledge_base;
DROP POLICY IF EXISTS ai_knowledge_base_delete_authenticated ON public.ai_knowledge_base;

CREATE POLICY ai_knowledge_base_insert_admin ON public.ai_knowledge_base FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY ai_knowledge_base_update_admin ON public.ai_knowledge_base FOR UPDATE USING (public.is_admin());
CREATE POLICY ai_knowledge_base_delete_admin ON public.ai_knowledge_base FOR DELETE USING (public.is_admin());

-- Tabela: crop_calendar
DROP POLICY IF EXISTS crop_calendar_insert_authenticated ON public.crop_calendar;
DROP POLICY IF EXISTS crop_calendar_update_authenticated ON public.crop_calendar;
DROP POLICY IF EXISTS crop_calendar_delete_authenticated ON public.crop_calendar;

CREATE POLICY crop_calendar_insert_admin ON public.crop_calendar FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY crop_calendar_update_admin ON public.crop_calendar FOR UPDATE USING (public.is_admin());
CREATE POLICY crop_calendar_delete_admin ON public.crop_calendar FOR DELETE USING (public.is_admin());


-- ------------------------------------------------------------------------------
-- Módulo 3: Pedidos e Histórico Financeiro 
-- (Inserção controlada pelo Edge Function, Edição restrita, Leitura pelo dono ou Admin)
-- ------------------------------------------------------------------------------
-- Tabela: orders
-- Obs: Inserções geralmente acontecem via Serverless (Service Role Key que sobrepoe a RLS).
-- Mantemos UPDATE e DELETE para admins, e UPDATE limitado ao dono para ações muito específicas se necessário.
-- No design anterior liberavam "(true)", agora será checado cliente_id.
DROP POLICY IF EXISTS orders_insert_authenticated ON public.orders;
DROP POLICY IF EXISTS orders_update_authenticated ON public.orders;
DROP POLICY IF EXISTS orders_delete_authenticated ON public.orders;

CREATE POLICY orders_insert_self ON public.orders FOR INSERT WITH CHECK (cliente_id = auth.uid());
CREATE POLICY orders_update_self_or_admin ON public.orders FOR UPDATE USING (cliente_id = auth.uid() OR public.is_admin());
CREATE POLICY orders_delete_admin ON public.orders FOR DELETE USING (public.is_admin());

-- Tabela: order_items
-- Os items de pedidos precisam garantir que só quem fez o pedido dono os acesse.
DROP POLICY IF EXISTS order_items_insert_authenticated ON public.order_items;
DROP POLICY IF EXISTS order_items_update_authenticated ON public.order_items;
DROP POLICY IF EXISTS order_items_delete_authenticated ON public.order_items;

CREATE POLICY order_items_insert_admin ON public.order_items FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM public.orders WHERE id = order_items.order_id AND (cliente_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY order_items_update_admin ON public.order_items FOR UPDATE USING (
    EXISTS(SELECT 1 FROM public.orders WHERE id = order_items.order_id AND (cliente_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY order_items_delete_admin ON public.order_items FOR DELETE USING (public.is_admin());

-- Tabela: payments
DROP POLICY IF EXISTS payments_insert_authenticated ON public.payments;
DROP POLICY IF EXISTS payments_update_authenticated ON public.payments;
DROP POLICY IF EXISTS payments_delete_authenticated ON public.payments;

CREATE POLICY payments_insert_system ON public.payments FOR INSERT WITH CHECK (
   EXISTS(SELECT 1 FROM public.orders WHERE id = payments.order_id AND (cliente_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY payments_update_system ON public.payments FOR UPDATE USING (
   EXISTS(SELECT 1 FROM public.orders WHERE id = payments.order_id AND public.is_admin())
);
CREATE POLICY payments_delete_system ON public.payments FOR DELETE USING (public.is_admin());


-- ------------------------------------------------------------------------------
-- Módulo 4: Chat de Conversas e Frete (Somente intervenção do dono)
-- ------------------------------------------------------------------------------
-- Tabela: chat_conversations
DROP POLICY IF EXISTS chat_conversations_insert_authenticated ON public.chat_conversations;
DROP POLICY IF EXISTS chat_conversations_update_authenticated ON public.chat_conversations;
DROP POLICY IF EXISTS chat_conversations_delete_authenticated ON public.chat_conversations;

CREATE POLICY chat_conversations_insert_self ON public.chat_conversations FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY chat_conversations_update_self_admin ON public.chat_conversations FOR UPDATE USING (customer_id = auth.uid() OR public.is_admin());
CREATE POLICY chat_conversations_delete_admin ON public.chat_conversations FOR DELETE USING (public.is_admin());

-- Tabela: chat_messages
DROP POLICY IF EXISTS chat_messages_insert_authenticated ON public.chat_messages;
DROP POLICY IF EXISTS chat_messages_update_authenticated ON public.chat_messages;
DROP POLICY IF EXISTS chat_messages_delete_authenticated ON public.chat_messages;

CREATE POLICY chat_messages_insert_self ON public.chat_messages FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM public.chat_conversations WHERE id = chat_messages.conversation_id AND (customer_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY chat_messages_update_admin ON public.chat_messages FOR UPDATE USING (public.is_admin());
CREATE POLICY chat_messages_delete_admin ON public.chat_messages FOR DELETE USING (public.is_admin());

-- Tabela: shipping_quotes
DROP POLICY IF EXISTS shipping_quotes_insert_authenticated ON public.shipping_quotes;
DROP POLICY IF EXISTS shipping_quotes_update_authenticated ON public.shipping_quotes;
DROP POLICY IF EXISTS shipping_quotes_delete_authenticated ON public.shipping_quotes;

CREATE POLICY shipping_quotes_insert_admin ON public.shipping_quotes FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY shipping_quotes_update_admin ON public.shipping_quotes FOR UPDATE USING (public.is_admin());
CREATE POLICY shipping_quotes_delete_admin ON public.shipping_quotes FOR DELETE USING (public.is_admin());

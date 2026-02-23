-- Políticas RLS para CRUD: catálogo público lê; utilizadores autenticados podem escrever (admin no app).
-- Aplicar: npx supabase db push ou via Dashboard SQL / MCP apply_migration.

-- products: leitura pública; escrita (insert/update/delete) para autenticados
DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public" ON public.products FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "products_insert_authenticated" ON public.products;
CREATE POLICY "products_insert_authenticated" ON public.products FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "products_update_authenticated" ON public.products;
CREATE POLICY "products_update_authenticated" ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "products_delete_authenticated" ON public.products;
CREATE POLICY "products_delete_authenticated" ON public.products FOR DELETE TO authenticated USING (true);

-- banners: igual
DROP POLICY IF EXISTS "banners_select_public" ON public.banners;
CREATE POLICY "banners_select_public" ON public.banners FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "banners_insert_authenticated" ON public.banners;
CREATE POLICY "banners_insert_authenticated" ON public.banners FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "banners_update_authenticated" ON public.banners;
CREATE POLICY "banners_update_authenticated" ON public.banners FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "banners_delete_authenticated" ON public.banners;
CREATE POLICY "banners_delete_authenticated" ON public.banners FOR DELETE TO authenticated USING (true);

-- store_settings: CRUD para autenticados (leitura pública)
DROP POLICY IF EXISTS "store_settings_select_public" ON public.store_settings;
CREATE POLICY "store_settings_select_public" ON public.store_settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "store_settings_insert_authenticated" ON public.store_settings;
CREATE POLICY "store_settings_insert_authenticated" ON public.store_settings FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "store_settings_update_authenticated" ON public.store_settings;
CREATE POLICY "store_settings_update_authenticated" ON public.store_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "store_settings_delete_authenticated" ON public.store_settings;
CREATE POLICY "store_settings_delete_authenticated" ON public.store_settings FOR DELETE TO authenticated USING (true);

-- orders: CRUD para autenticados
DROP POLICY IF EXISTS "orders_select_authenticated" ON public.orders;
CREATE POLICY "orders_select_authenticated" ON public.orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "orders_insert_authenticated" ON public.orders;
CREATE POLICY "orders_insert_authenticated" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "orders_update_authenticated" ON public.orders;
CREATE POLICY "orders_update_authenticated" ON public.orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "orders_delete_authenticated" ON public.orders;
CREATE POLICY "orders_delete_authenticated" ON public.orders FOR DELETE TO authenticated USING (true);

-- order_items: autenticados
DROP POLICY IF EXISTS "order_items_select_authenticated" ON public.order_items;
CREATE POLICY "order_items_select_authenticated" ON public.order_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "order_items_insert_authenticated" ON public.order_items;
CREATE POLICY "order_items_insert_authenticated" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_update_authenticated" ON public.order_items;
CREATE POLICY "order_items_update_authenticated" ON public.order_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_delete_authenticated" ON public.order_items;
CREATE POLICY "order_items_delete_authenticated" ON public.order_items FOR DELETE TO authenticated USING (true);

-- profiles: SELECT público (joins em reviews/orders para nome; anon vê nomes nas reviews); INSERT/UPDATE/DELETE só próprio
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (id = auth.uid());

-- product_documents: leitura pública; escrita autenticada
DROP POLICY IF EXISTS "product_documents_select_public" ON public.product_documents;
CREATE POLICY "product_documents_select_public" ON public.product_documents FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "product_documents_insert_authenticated" ON public.product_documents;
CREATE POLICY "product_documents_insert_authenticated" ON public.product_documents FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "product_documents_update_authenticated" ON public.product_documents;
CREATE POLICY "product_documents_update_authenticated" ON public.product_documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "product_documents_delete_authenticated" ON public.product_documents;
CREATE POLICY "product_documents_delete_authenticated" ON public.product_documents FOR DELETE TO authenticated USING (true);

-- crop_calendar: leitura pública; escrita autenticada
DROP POLICY IF EXISTS "crop_calendar_select_public" ON public.crop_calendar;
CREATE POLICY "crop_calendar_select_public" ON public.crop_calendar FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "crop_calendar_insert_authenticated" ON public.crop_calendar;
CREATE POLICY "crop_calendar_insert_authenticated" ON public.crop_calendar FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "crop_calendar_update_authenticated" ON public.crop_calendar;
CREATE POLICY "crop_calendar_update_authenticated" ON public.crop_calendar FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "crop_calendar_delete_authenticated" ON public.crop_calendar;
CREATE POLICY "crop_calendar_delete_authenticated" ON public.crop_calendar FOR DELETE TO authenticated USING (true);

-- ai_knowledge_base: autenticados leem e escrevem
DROP POLICY IF EXISTS "ai_knowledge_base_select_authenticated" ON public.ai_knowledge_base;
CREATE POLICY "ai_knowledge_base_select_authenticated" ON public.ai_knowledge_base FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ai_knowledge_base_insert_authenticated" ON public.ai_knowledge_base;
CREATE POLICY "ai_knowledge_base_insert_authenticated" ON public.ai_knowledge_base FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "ai_knowledge_base_update_authenticated" ON public.ai_knowledge_base;
CREATE POLICY "ai_knowledge_base_update_authenticated" ON public.ai_knowledge_base FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ai_knowledge_base_delete_authenticated" ON public.ai_knowledge_base;
CREATE POLICY "ai_knowledge_base_delete_authenticated" ON public.ai_knowledge_base FOR DELETE TO authenticated USING (true);

-- chat_conversations: CRUD autenticados
DROP POLICY IF EXISTS "chat_conversations_select_authenticated" ON public.chat_conversations;
CREATE POLICY "chat_conversations_select_authenticated" ON public.chat_conversations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "chat_conversations_insert_authenticated" ON public.chat_conversations;
CREATE POLICY "chat_conversations_insert_authenticated" ON public.chat_conversations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "chat_conversations_update_authenticated" ON public.chat_conversations;
CREATE POLICY "chat_conversations_update_authenticated" ON public.chat_conversations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "chat_conversations_delete_authenticated" ON public.chat_conversations;
CREATE POLICY "chat_conversations_delete_authenticated" ON public.chat_conversations FOR DELETE TO authenticated USING (true);

-- chat_messages: CRUD autenticados
DROP POLICY IF EXISTS "chat_messages_select_authenticated" ON public.chat_messages;
CREATE POLICY "chat_messages_select_authenticated" ON public.chat_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "chat_messages_insert_authenticated" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_authenticated" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "chat_messages_update_authenticated" ON public.chat_messages;
CREATE POLICY "chat_messages_update_authenticated" ON public.chat_messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "chat_messages_delete_authenticated" ON public.chat_messages;
CREATE POLICY "chat_messages_delete_authenticated" ON public.chat_messages FOR DELETE TO authenticated USING (true);

-- wishlist: CRUD próprio
DROP POLICY IF EXISTS "wishlist_select_own" ON public.wishlist;
CREATE POLICY "wishlist_select_own" ON public.wishlist FOR SELECT TO authenticated USING (cliente_id = auth.uid());

DROP POLICY IF EXISTS "wishlist_insert_own" ON public.wishlist;
CREATE POLICY "wishlist_insert_own" ON public.wishlist FOR INSERT TO authenticated WITH CHECK (cliente_id = auth.uid());

DROP POLICY IF EXISTS "wishlist_update_own" ON public.wishlist;
CREATE POLICY "wishlist_update_own" ON public.wishlist FOR UPDATE TO authenticated USING (cliente_id = auth.uid()) WITH CHECK (cliente_id = auth.uid());

DROP POLICY IF EXISTS "wishlist_delete_own" ON public.wishlist;
CREATE POLICY "wishlist_delete_own" ON public.wishlist FOR DELETE TO authenticated USING (cliente_id = auth.uid());

-- reviews: CRUD (leitura pública; escrita próprio)
DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
CREATE POLICY "reviews_select_public" ON public.reviews FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "reviews_insert_authenticated" ON public.reviews;
CREATE POLICY "reviews_insert_authenticated" ON public.reviews FOR INSERT TO authenticated WITH CHECK (cliente_id = auth.uid());

DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE TO authenticated USING (cliente_id = auth.uid()) WITH CHECK (cliente_id = auth.uid());

DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;
CREATE POLICY "reviews_delete_own" ON public.reviews FOR DELETE TO authenticated USING (cliente_id = auth.uid());

-- payments: CRUD autenticados
DROP POLICY IF EXISTS "payments_select_authenticated" ON public.payments;
CREATE POLICY "payments_select_authenticated" ON public.payments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "payments_insert_authenticated" ON public.payments;
CREATE POLICY "payments_insert_authenticated" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "payments_update_authenticated" ON public.payments;
CREATE POLICY "payments_update_authenticated" ON public.payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "payments_delete_authenticated" ON public.payments;
CREATE POLICY "payments_delete_authenticated" ON public.payments FOR DELETE TO authenticated USING (true);

-- shipping_quotes: CRUD autenticados
DROP POLICY IF EXISTS "shipping_quotes_select_authenticated" ON public.shipping_quotes;
CREATE POLICY "shipping_quotes_select_authenticated" ON public.shipping_quotes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "shipping_quotes_insert_authenticated" ON public.shipping_quotes;
CREATE POLICY "shipping_quotes_insert_authenticated" ON public.shipping_quotes FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "shipping_quotes_update_authenticated" ON public.shipping_quotes;
CREATE POLICY "shipping_quotes_update_authenticated" ON public.shipping_quotes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "shipping_quotes_delete_authenticated" ON public.shipping_quotes;
CREATE POLICY "shipping_quotes_delete_authenticated" ON public.shipping_quotes FOR DELETE TO authenticated USING (true);

-- n8n_webhook_logs: CRUD autenticados (backend/n8n ou app)
DROP POLICY IF EXISTS "n8n_webhook_logs_select_authenticated" ON public.n8n_webhook_logs;
CREATE POLICY "n8n_webhook_logs_select_authenticated" ON public.n8n_webhook_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "n8n_webhook_logs_insert_authenticated" ON public.n8n_webhook_logs;
CREATE POLICY "n8n_webhook_logs_insert_authenticated" ON public.n8n_webhook_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "n8n_webhook_logs_update_authenticated" ON public.n8n_webhook_logs;
CREATE POLICY "n8n_webhook_logs_update_authenticated" ON public.n8n_webhook_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "n8n_webhook_logs_delete_authenticated" ON public.n8n_webhook_logs;
CREATE POLICY "n8n_webhook_logs_delete_authenticated" ON public.n8n_webhook_logs FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Schema base do banco Aquimaq — gerado automaticamente
-- Data: 2026-03-09T11:21:29.846Z
-- Supabase projeto: bzicdqrbqykypzesxayw
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==========================================
-- Tabela: ai_knowledge_base
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  product_document_id uuid NOT NULL,
  product_id uuid NOT NULL,
  content text NOT NULL,
  embedding vector NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT ai_knowledge_base_product_document_id_fkey FOREIGN KEY (product_document_id) REFERENCES public.product_documents (id) ON DELETE CASCADE
);

-- ==========================================
-- Tabela: banners
-- ==========================================
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text,
  image_url text,
  cta text,
  color_gradient text,
  position integer DEFAULT 0,
  is_active boolean DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  subtitle text,
  cta_text text,
  cta_link text,
  PRIMARY KEY (id)
);

-- ==========================================
-- Tabela: crop_calendar
-- ==========================================
CREATE TABLE IF NOT EXISTS public.crop_calendar (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  culture text NOT NULL,
  region text,
  month_plant_start smallint NOT NULL,
  month_plant_end smallint NOT NULL,
  month_harvest_start smallint NOT NULL,
  month_harvest_end smallint NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

-- ==========================================
-- Tabela: order_items
-- ==========================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  product_id uuid,
  product_name text,
  quantity integer NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  total_price numeric(12,2),
  PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders (id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE SET NULL
);

-- ==========================================
-- Tabela: orders
-- ==========================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  cliente_id uuid,
  status order_status DEFAULT 'aguardando_pagamento'::order_status NOT NULL,
  subtotal numeric(12,2) DEFAULT 0 NOT NULL,
  shipping_cost numeric(12,2) DEFAULT 0 NOT NULL,
  total numeric(12,2) DEFAULT 0 NOT NULL,
  shipping_method text,
  shipping_address jsonb,
  payment_method text,
  payment_details jsonb,
  tracking_code text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  vendedor_id uuid,
  stock_restored boolean DEFAULT false NOT NULL,
  stock_decremented boolean DEFAULT false NOT NULL,
  me_order_id text,
  tracking_url text,
  shipping_status text,
  PRIMARY KEY (id),
  CONSTRAINT orders_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.profiles (id) ON DELETE SET NULL,
  CONSTRAINT orders_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.profiles (id) ON DELETE SET NULL
);

-- ==========================================
-- Tabela: payments
-- ==========================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  external_id text,
  external_reference text,
  status payment_status DEFAULT 'pending'::payment_status NOT NULL,
  status_detail text,
  payment_type text,
  amount numeric(12,2),
  currency text DEFAULT 'BRL'::text,
  payer_email text,
  payer_document text,
  installments smallint,
  mp_preference_id text,
  mp_checkout_url text,
  pix_qr_code text,
  pix_qr_code_base64 text,
  boleto_url text,
  raw_webhook jsonb,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders (id) ON DELETE CASCADE,
  CONSTRAINT payments_external_reference_key UNIQUE (external_reference)
);

-- ==========================================
-- Tabela: product_documents
-- ==========================================
CREATE TABLE IF NOT EXISTS public.product_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  product_id uuid NOT NULL,
  title text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text NOT NULL,
  processed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (id),
  CONSTRAINT product_documents_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE CASCADE
);

-- ==========================================
-- Tabela: products
-- ==========================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  slug text,
  description text,
  technical_specs text,
  price numeric(12,2),
  old_price numeric(12,2),
  discount numeric(5,2),
  stock integer DEFAULT 0,
  category text,
  image_url text,
  gallery jsonb,
  is_active boolean DEFAULT true,
  is_new boolean DEFAULT false,
  is_best_seller boolean DEFAULT false,
  rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  weight numeric(10,3),
  width numeric(10,2),
  height numeric(10,2),
  length numeric(10,2),
  brand text,
  culture text,
  wholesale_min_amount integer,
  wholesale_discount_percent numeric(5,2),
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  vendedor_id uuid,
  PRIMARY KEY (id),
  CONSTRAINT products_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.profiles (id) ON DELETE SET NULL,
  CONSTRAINT products_slug_key UNIQUE (slug),
  CONSTRAINT products_stock_non_negative CHECK ((stock >= 0))
);

-- ==========================================
-- Tabela: profiles
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  name text,
  email text,
  document_number text,
  document_type text,
  state_registration text,
  phone text,
  avatar_url text,
  role user_role DEFAULT 'cliente'::user_role NOT NULL,
  cep text,
  address text,
  address_number text,
  address_complement text,
  neighborhood text,
  city text,
  state text,
  cart_items jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  street text,
  number text,
  complement text,
  zip_code text,
  PRIMARY KEY (id)
);

-- ==========================================
-- Tabela: reviews
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  cliente_id uuid NOT NULL,
  product_id uuid NOT NULL,
  rating smallint NOT NULL,
  comment text,
  verified_purchase boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT reviews_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE CASCADE,
  CONSTRAINT reviews_cliente_id_product_id_key UNIQUE (cliente_id, product_id),
  CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);

-- ==========================================
-- Tabela: shipping_quotes
-- ==========================================
CREATE TABLE IF NOT EXISTS public.shipping_quotes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid,
  origin_cep text,
  destination_cep text,
  packages jsonb,
  quotes jsonb,
  selected_service text,
  selected_price numeric(12,2),
  tracking_code text,
  me_shipment_id text,
  me_label_url text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT shipping_quotes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders (id) ON DELETE SET NULL
);

-- ==========================================
-- Tabela: store_settings
-- ==========================================
CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  store_name text,
  cnpj text,
  email text,
  phone text,
  whatsapp text,
  social_media jsonb,
  origin_cep text,
  origin_street text,
  origin_number text,
  origin_complement text,
  origin_district text,
  origin_city text,
  origin_state text,
  description text,
  opening_hours text,
  logo_url text,
  banner_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  max_installments integer DEFAULT 12 NOT NULL,
  accepted_payment_types jsonb DEFAULT '["credit_card", "debit_card", "bank_transfer", "ticket"]'::jsonb NOT NULL,
  banner_slide_interval_ms integer DEFAULT 5000 NOT NULL,
  razao_social text,
  reclame_aqui_url text,
  PRIMARY KEY (id)
);

-- ==========================================
-- Tabela: wishlist
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  cliente_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT wishlist_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE CASCADE,
  CONSTRAINT wishlist_cliente_id_product_id_key UNIQUE (cliente_id, product_id)
);

-- ==========================================
-- Índices
-- ==========================================
CREATE INDEX idx_ai_knowledge_base_embedding ON public.ai_knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists='100');
CREATE INDEX idx_ai_knowledge_base_product_document_id ON public.ai_knowledge_base USING btree (product_document_id);
CREATE INDEX idx_ai_knowledge_base_product_id ON public.ai_knowledge_base USING btree (product_id);
CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);
CREATE INDEX idx_orders_cliente_id ON public.orders USING btree (cliente_id);
CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);
CREATE INDEX idx_orders_me_order_id ON public.orders USING btree (me_order_id) WHERE (me_order_id IS NOT NULL);
CREATE INDEX idx_orders_status ON public.orders USING btree (status);
CREATE INDEX idx_orders_vendedor_id ON public.orders USING btree (vendedor_id);
CREATE INDEX idx_payments_external_reference ON public.payments USING btree (external_reference);
CREATE INDEX idx_payments_order_id ON public.payments USING btree (order_id);
CREATE INDEX idx_products_brand ON public.products USING btree (brand);
CREATE INDEX idx_products_category ON public.products USING btree (category);
CREATE INDEX idx_products_is_active ON public.products USING btree (is_active);
CREATE INDEX idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_slug ON public.products USING btree (slug);
CREATE INDEX idx_products_vendedor_id ON public.products USING btree (vendedor_id);
CREATE INDEX idx_reviews_product_id ON public.reviews USING btree (product_id);
CREATE INDEX idx_shipping_quotes_order_id ON public.shipping_quotes USING btree (order_id);
CREATE INDEX idx_wishlist_cliente_id ON public.wishlist USING btree (cliente_id);

-- ==========================================
-- Row Level Security
-- ==========================================
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Políticas RLS
-- ==========================================
CREATE POLICY "Allow delete ai_knowledge_base for service role" ON public.ai_knowledge_base FOR DELETE TO {service_role}
  USING (true);

CREATE POLICY "Allow insert ai_knowledge_base for service role" ON public.ai_knowledge_base FOR INSERT TO {service_role}
  WITH CHECK (true);

CREATE POLICY "Allow read ai_knowledge_base for authenticated" ON public.ai_knowledge_base FOR SELECT TO {authenticated}
  USING (true);

CREATE POLICY "Permitir leitura pública banners" ON public.banners FOR SELECT TO {}
  USING (true);

CREATE POLICY "banners_all_admin" ON public.banners FOR ALL TO {}
  USING (is_admin_or_manager());

CREATE POLICY "banners_delete_admin" ON public.banners FOR DELETE TO {}
  USING (is_admin());

CREATE POLICY "banners_insert_admin" ON public.banners FOR INSERT TO {}
  WITH CHECK (is_admin());

CREATE POLICY "banners_select_active" ON public.banners FOR SELECT TO {}
  USING ((is_active = true));

CREATE POLICY "banners_select_public" ON public.banners FOR SELECT TO {}
  USING (true);

CREATE POLICY "banners_update_admin" ON public.banners FOR UPDATE TO {}
  USING (is_admin());

CREATE POLICY "crop_calendar_all_admin" ON public.crop_calendar FOR ALL TO {}
  USING (is_admin_or_manager());

CREATE POLICY "crop_calendar_delete_admin" ON public.crop_calendar FOR DELETE TO {}
  USING (is_admin());

CREATE POLICY "crop_calendar_insert_admin" ON public.crop_calendar FOR INSERT TO {}
  WITH CHECK (is_admin());

CREATE POLICY "crop_calendar_select" ON public.crop_calendar FOR SELECT TO {}
  USING (true);

CREATE POLICY "crop_calendar_select_public" ON public.crop_calendar FOR SELECT TO {}
  USING (true);

CREATE POLICY "crop_calendar_update_admin" ON public.crop_calendar FOR UPDATE TO {}
  USING (is_admin());

CREATE POLICY "order_items_delete_admin" ON public.order_items FOR DELETE TO {}
  USING (is_admin());

CREATE POLICY "order_items_insert_admin" ON public.order_items FOR INSERT TO {}
  WITH CHECK ((EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = order_items.order_id) AND ((orders.cliente_id = auth.uid()) OR is_admin())))));

CREATE POLICY "order_items_select_authenticated" ON public.order_items FOR SELECT TO {authenticated}
  USING (true);

CREATE POLICY "order_items_select_via_order" ON public.order_items FOR SELECT TO {}
  USING ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_items.order_id) AND ((o.cliente_id = auth.uid()) OR is_staff())))));

CREATE POLICY "order_items_update_admin" ON public.order_items FOR UPDATE TO {}
  USING ((EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = order_items.order_id) AND ((orders.cliente_id = auth.uid()) OR is_admin())))));

CREATE POLICY "orders_delete_admin" ON public.orders FOR DELETE TO {}
  USING (is_admin());

CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT TO {}
  WITH CHECK ((cliente_id = auth.uid()));

CREATE POLICY "orders_insert_self" ON public.orders FOR INSERT TO {}
  WITH CHECK ((cliente_id = auth.uid()));

CREATE POLICY "orders_select_authenticated" ON public.orders FOR SELECT TO {authenticated}
  USING (true);

CREATE POLICY "orders_select_own" ON public.orders FOR SELECT TO {}
  USING ((cliente_id = auth.uid()));

CREATE POLICY "orders_select_staff" ON public.orders FOR SELECT TO {}
  USING (is_staff());

CREATE POLICY "orders_update_self_or_admin" ON public.orders FOR UPDATE TO {}
  USING (((cliente_id = auth.uid()) OR is_admin()));

CREATE POLICY "orders_update_staff" ON public.orders FOR UPDATE TO {}
  USING (is_admin_or_manager());

CREATE POLICY "vendedor_select_own_orders" ON public.orders FOR SELECT TO {authenticated}
  USING (((vendedor_id = auth.uid()) OR (vendedor_id IS NULL) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'gerente'::user_role]))));

CREATE POLICY "vendedor_update_own_orders" ON public.orders FOR UPDATE TO {authenticated}
  USING (((vendedor_id = auth.uid()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'gerente'::user_role]))));

CREATE POLICY "payments_delete_system" ON public.payments FOR DELETE TO {}
  USING (is_admin());

CREATE POLICY "payments_insert_system" ON public.payments FOR INSERT TO {}
  WITH CHECK ((EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = payments.order_id) AND ((orders.cliente_id = auth.uid()) OR is_admin())))));

CREATE POLICY "payments_select_authenticated" ON public.payments FOR SELECT TO {authenticated}
  USING (true);

CREATE POLICY "payments_select_via_order" ON public.payments FOR SELECT TO {}
  USING ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = payments.order_id) AND ((o.cliente_id = auth.uid()) OR is_staff())))));

CREATE POLICY "payments_update_system" ON public.payments FOR UPDATE TO {}
  USING ((EXISTS ( SELECT 1
   FROM orders
  WHERE ((orders.id = payments.order_id) AND is_admin()))));

CREATE POLICY "Allow authenticated delete product_documents" ON public.product_documents FOR DELETE TO {authenticated}
  USING (true);

CREATE POLICY "Allow authenticated insert product_documents" ON public.product_documents FOR INSERT TO {authenticated}
  WITH CHECK (true);

CREATE POLICY "Allow authenticated read product_documents" ON public.product_documents FOR SELECT TO {authenticated}
  USING (true);

CREATE POLICY "Allow authenticated update product_documents" ON public.product_documents FOR UPDATE TO {authenticated}
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir alteração apenas para autorizados" ON public.products FOR ALL TO {}
  USING ((auth.role() = 'authenticated'::text));

CREATE POLICY "Permitir leitura pública" ON public.products FOR SELECT TO {}
  USING (true);

CREATE POLICY "products_all_admin" ON public.products FOR ALL TO {}
  USING (is_admin_or_manager());

CREATE POLICY "products_delete_admin" ON public.products FOR DELETE TO {}
  USING (is_admin());

CREATE POLICY "products_insert_admin" ON public.products FOR INSERT TO {}
  WITH CHECK (is_admin());

CREATE POLICY "products_select_active" ON public.products FOR SELECT TO {}
  USING ((is_active = true));

CREATE POLICY "products_select_public" ON public.products FOR SELECT TO {}
  USING (true);

CREATE POLICY "products_update_admin" ON public.products FOR UPDATE TO {}
  USING (is_admin());

CREATE POLICY "vendedor_insert_own_products" ON public.products FOR INSERT TO {authenticated}
  WITH CHECK (((vendedor_id = auth.uid()) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'gerente'::user_role]))));

CREATE POLICY "vendedor_select_own_products" ON public.products FOR SELECT TO {authenticated}
  USING (((vendedor_id = auth.uid()) OR (vendedor_id IS NULL) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'gerente'::user_role]))));

CREATE POLICY "vendedor_update_own_products" ON public.products FOR UPDATE TO {authenticated}
  USING (((vendedor_id = auth.uid()) OR (vendedor_id IS NULL) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'gerente'::user_role]))))
  WITH CHECK (((vendedor_id = auth.uid()) OR (vendedor_id IS NULL) OR (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['admin'::user_role, 'gerente'::user_role]))));

CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO {authenticated}
  USING ((id = auth.uid()));

CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO {authenticated}
  WITH CHECK ((id = auth.uid()));

CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT TO {}
  USING (true);

CREATE POLICY "profiles_select_staff" ON public.profiles FOR SELECT TO {}
  USING (is_staff());

CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO {}
  USING (is_admin_or_manager());

CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO {authenticated}
  USING ((id = auth.uid()))
  WITH CHECK ((id = auth.uid()));

CREATE POLICY "reviews_delete_admin" ON public.reviews FOR DELETE TO {}
  USING (is_admin_or_manager());

CREATE POLICY "reviews_delete_own" ON public.reviews FOR DELETE TO {authenticated}
  USING ((cliente_id = auth.uid()));

CREATE POLICY "reviews_insert_authenticated" ON public.reviews FOR INSERT TO {authenticated}
  WITH CHECK ((cliente_id = auth.uid()));

CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT TO {}
  WITH CHECK ((cliente_id = auth.uid()));

CREATE POLICY "reviews_select" ON public.reviews FOR SELECT TO {}
  USING (true);

CREATE POLICY "reviews_select_public" ON public.reviews FOR SELECT TO {}
  USING (true);

CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE TO {authenticated}
  USING ((cliente_id = auth.uid()))
  WITH CHECK ((cliente_id = auth.uid()));

CREATE POLICY "shipping_quotes_delete_admin" ON public.shipping_quotes FOR DELETE TO {}
  USING (is_admin());

CREATE POLICY "shipping_quotes_insert_admin" ON public.shipping_quotes FOR INSERT TO {}
  WITH CHECK (is_admin());

CREATE POLICY "shipping_quotes_select_authenticated" ON public.shipping_quotes FOR SELECT TO {authenticated}
  USING (true);

CREATE POLICY "shipping_quotes_select_via_order" ON public.shipping_quotes FOR SELECT TO {}
  USING (((order_id IS NULL) OR (EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = shipping_quotes.order_id) AND ((o.cliente_id = auth.uid()) OR is_staff()))))));

CREATE POLICY "shipping_quotes_update_admin" ON public.shipping_quotes FOR UPDATE TO {}
  USING (is_admin());

CREATE POLICY "store_settings_delete_admin" ON public.store_settings FOR DELETE TO {}
  USING (is_admin());

CREATE POLICY "store_settings_insert_admin" ON public.store_settings FOR INSERT TO {}
  WITH CHECK (is_admin());

CREATE POLICY "store_settings_modify_admin" ON public.store_settings FOR ALL TO {}
  USING (is_admin_or_manager());

CREATE POLICY "store_settings_select" ON public.store_settings FOR SELECT TO {}
  USING (true);

CREATE POLICY "store_settings_select_public" ON public.store_settings FOR SELECT TO {}
  USING (true);

CREATE POLICY "store_settings_update_admin" ON public.store_settings FOR UPDATE TO {}
  USING (is_admin());

CREATE POLICY "wishlist_all_own" ON public.wishlist FOR ALL TO {}
  USING ((cliente_id = auth.uid()));

CREATE POLICY "wishlist_delete_own" ON public.wishlist FOR DELETE TO {authenticated}
  USING ((cliente_id = auth.uid()));

CREATE POLICY "wishlist_insert_own" ON public.wishlist FOR INSERT TO {authenticated}
  WITH CHECK ((cliente_id = auth.uid()));

CREATE POLICY "wishlist_select_own" ON public.wishlist FOR SELECT TO {authenticated}
  USING ((cliente_id = auth.uid()));

CREATE POLICY "wishlist_update_own" ON public.wishlist FOR UPDATE TO {authenticated}
  USING ((cliente_id = auth.uid()))
  WITH CHECK ((cliente_id = auth.uid()));

-- ==========================================
-- Funções
-- ==========================================
CREATE OR REPLACE FUNCTION public.ai_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_expired_orders()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  expired_orders RECORD;
BEGIN
  -- Percorre todos os pedidos da condição para tratar em lote ou registrar logs
  FOR expired_orders IN 
    SELECT id 
    FROM public.orders 
    WHERE status = 'aguardando_pagamento' 
      AND created_at < NOW() - INTERVAL '24 hours'
  LOOP
    -- 1. Atualizar Pedido
    UPDATE public.orders
    SET 
        status = 'cancelado', 
        updated_at = NOW()
    WHERE id = expired_orders.id;

    -- 2. Atualizar Pagamento associado
    UPDATE public.payments
    SET 
        status = 'cancelled', 
        updated_at = NOW()
    WHERE order_id = expired_orders.id
      -- atualiza só os que também constem ainda como pending ou in_process pra segurança extra.
      AND status IN ('pending', 'in_process', 'aguardando_pagamento');
      
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_document_exists(p_drive_file_id text)
 RETURNS json
 LANGUAGE sql
 STABLE
AS $function$
  SELECT json_build_object(
    'already_exists',
    EXISTS(
      SELECT 1 FROM public.rag_documents
      WHERE drive_file_id = p_drive_file_id
      AND status = 'indexado'
    )
  );
$function$
;

CREATE OR REPLACE FUNCTION public.create_order(p_cliente_id uuid, p_items jsonb, p_shipping_cost numeric, p_subtotal numeric, p_total numeric, p_shipping_method text, p_shipping_address jsonb, p_payment_method text, p_payment_details jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE new_order_id uuid; item jsonb; p_id uuid; qty int; pname text; current_stock int;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    p_id := (item->>'product_id')::uuid; qty := (item->>'quantity')::int; pname := item->>'product_name';
    SELECT stock INTO current_stock FROM public.products WHERE id = p_id FOR UPDATE;
    IF current_stock IS NULL THEN RAISE EXCEPTION 'Produto nao encontrado'; END IF;
    IF current_stock < qty THEN RAISE EXCEPTION 'Estoque insuficiente'; END IF;
    UPDATE public.products SET stock = stock - qty WHERE id = p_id;
  END LOOP;
  INSERT INTO public.orders (cliente_id, status, subtotal, shipping_cost, total, shipping_method, shipping_address, payment_method, payment_details)
  VALUES (p_cliente_id, 'aguardando_pagamento', p_subtotal, p_shipping_cost, p_total, p_shipping_method, p_shipping_address, p_payment_method, p_payment_details)
  RETURNING id INTO new_order_id;
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price)
    VALUES (new_order_id, (item->>'product_id')::uuid, item->>'product_name', (item->>'quantity')::int, (item->>'unit_price')::numeric);
  END LOOP;
  RETURN jsonb_build_object('id', new_order_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.decrement_stock_for_order(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
BEGIN
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
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_daily_sales(p_period_days integer DEFAULT 30)
 RETURNS TABLE(sale_date date, revenue numeric, orders_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN RETURN QUERY SELECT date_trunc('day', o.created_at)::date, COALESCE(SUM(o.total) FILTER (WHERE o.status IN ('pago','em_separacao','enviado','pronto_retirada','entregue')), 0), count(*)::bigint FROM public.orders o WHERE o.created_at >= now() - (p_period_days || ' days')::interval GROUP BY date_trunc('day', o.created_at) ORDER BY 1 DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_product_ranking(p_max_results integer DEFAULT 10)
 RETURNS TABLE(product_id uuid, product_name text, units_sold bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN RETURN QUERY SELECT oi.product_id, oi.product_name, SUM(oi.quantity)::bigint FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id WHERE o.status IN ('pago','em_separacao','enviado','pronto_retirada','entregue') GROUP BY oi.product_id, oi.product_name ORDER BY 3 DESC LIMIT p_max_results;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_sales_summary(p_period_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object('total_revenue', COALESCE(SUM(total) FILTER (WHERE status IN ('pago','em_separacao','enviado','pronto_retirada','entregue')), 0), 'total_orders', count(*), 'paid', count(*) FILTER (WHERE status IN ('pago','em_separacao','enviado','pronto_retirada','entregue')), 'pending', count(*) FILTER (WHERE status = 'aguardando_pagamento'), 'cancelled', count(*) FILTER (WHERE status = 'cancelado'), 'avg_ticket', COALESCE(AVG(total) FILTER (WHERE status IN ('pago','em_separacao','enviado','pronto_retirada','entregue')), 0), 'orders_today', count(*) FILTER (WHERE created_at >= date_trunc('day', now())), 'revenue_today', COALESCE(SUM(total) FILTER (WHERE created_at >= date_trunc('day', now()) AND status IN ('pago','em_separacao','enviado','pronto_retirada','entregue')), 0)) INTO result FROM public.orders WHERE created_at >= now() - (p_period_days || ' days')::interval;
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    'cliente'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('admin', 'gerente')
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente')); $function$
;

CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'vendedor')); $function$
;

CREATE OR REPLACE FUNCTION public.match_knowledge(query_embedding vector, match_count integer DEFAULT 5, filter_product_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, product_document_id uuid, product_id uuid, content text, metadata jsonb, similarity double precision)
 LANGUAGE sql
 STABLE
AS $function$
  select k.id, k.product_document_id, k.product_id, k.content, k.metadata,
  1 - (k.embedding <=> query_embedding) as similarity
  from public.ai_knowledge_base k
  where (filter_product_id is null or k.product_id = filter_product_id)
  order by k.embedding <=> query_embedding
  limit match_count;
$function$
;

CREATE OR REPLACE FUNCTION public.match_knowledge_base(query_embedding vector, match_count integer DEFAULT 5, similarity_threshold double precision DEFAULT 0.7)
 RETURNS TABLE(id uuid, title text, content text, product_id uuid, similarity double precision)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.product_id,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM ai_knowledge_base kb
  WHERE
    kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
$function$
;

CREATE OR REPLACE FUNCTION public.match_product_documents(query_embedding vector, match_product_id uuid, match_count integer DEFAULT 5, similarity_threshold double precision DEFAULT 0.7)
 RETURNS TABLE(id uuid, title text, content text, similarity double precision)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    kb.id,
    kb.title,
    kb.content,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM ai_knowledge_base kb
  WHERE
    kb.product_id = match_product_id
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
$function$
;

CREATE OR REPLACE FUNCTION public.next_vendedor_for_handoff(last_agent_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  chosen UUID;
BEGIN
  IF last_agent_id IS NULL THEN
    SELECT p.id INTO chosen
    FROM public.profiles p
    WHERE p.role = 'vendedor'
    ORDER BY p.created_at NULLS LAST, p.id
    LIMIT 1;
  ELSE
    SELECT p.id INTO chosen
    FROM public.profiles p
    WHERE p.role = 'vendedor'
      AND (p.created_at, p.id) > (
        SELECT p2.created_at, p2.id
        FROM public.profiles p2
        WHERE p2.id = last_agent_id
      )
    ORDER BY p.created_at NULLS LAST, p.id
    LIMIT 1;

    IF chosen IS NULL THEN
      SELECT p.id INTO chosen
      FROM public.profiles p
      WHERE p.role = 'vendedor'
      ORDER BY p.created_at NULLS LAST, p.id
      LIMIT 1;
    END IF;
  END IF;

  RETURN chosen;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_order_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  evt text;
  payload jsonb;
BEGIN
  payload := to_jsonb(NEW);
  IF TG_OP = 'INSERT' THEN
    evt := 'order.created';
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    evt := 'order.' || NEW.status::text;
  ELSE
    RETURN NEW;
  END IF;
  INSERT INTO public.n8n_webhook_logs (event_type, payload, status)
  VALUES (evt, payload, 'pending');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_stock_low()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.stock IS NOT NULL AND NEW.stock <= 5 AND (OLD.stock IS NULL OR OLD.stock > 5) THEN
    INSERT INTO public.n8n_webhook_logs (event_type, payload, status)
    VALUES ('stock.low', jsonb_build_object('product_id', NEW.id, 'product_name', NEW.name, 'stock', NEW.stock), 'pending');
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.on_storage_upload_rag()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_tipo TEXT;
  v_path TEXT;
BEGIN
  -- Só processa bucket documentos-rag
  IF NEW.bucket_id != 'documentos-rag' THEN
    RETURN NEW;
  END IF;

  v_path := NEW.name;

  -- Detecta tipo pela pasta (bulas/ ou manuais/)
  IF v_path ILIKE 'bulas/%' THEN
    v_tipo := 'bula';
  ELSIF v_path ILIKE 'manuais/%' THEN
    v_tipo := 'manual_maquina';
  ELSE
    v_tipo := 'outro';
  END IF;

  -- Insere na fila (evita duplicata pelo path)
  INSERT INTO public.rag_queue (storage_path, file_name, mime_type, tipo)
  SELECT
    v_path,
    NEW.name,
    COALESCE(NEW.metadata->>'mimetype', 'application/pdf'),
    v_tipo
  WHERE NOT EXISTS (
    SELECT 1 FROM public.rag_queue
    WHERE storage_path = v_path AND status IN ('aguardando','processando','concluido')
  );

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rag_search(query_embedding vector, match_count integer DEFAULT 5, filter_tipo text DEFAULT NULL::text, similarity_threshold double precision DEFAULT 0.5)
 RETURNS TABLE(chunk_id uuid, document_id uuid, nome_documento text, tipo_documento text, conteudo text, similarity double precision, metadata jsonb)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    c.id AS chunk_id,
    d.id AS document_id,
    d.nome AS nome_documento,
    d.tipo AS tipo_documento,
    c.conteudo,
    1 - (c.embedding <=> query_embedding) AS similarity,
    c.metadata
  FROM public.rag_chunks c
  JOIN public.rag_documents d ON d.id = c.document_id
  WHERE
    d.status = 'indexado'
    AND (filter_tipo IS NULL OR d.tipo = filter_tipo)
    AND 1 - (c.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$function$
;

CREATE OR REPLACE FUNCTION public.recalculate_product_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  target_product_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD.product_id;
  ELSE
    target_product_id := NEW.product_id;
  END IF;
  UPDATE public.products
  SET
    rating = (SELECT COALESCE(round(AVG(rating)::numeric, 2), 0) FROM public.reviews WHERE product_id = target_product_id),
    review_count = (SELECT count(*) FROM public.reviews WHERE product_id = target_product_id),
    updated_at = now()
  WHERE id = target_product_id;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.restore_stock_from_unpaid_orders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r       RECORD;
  restored integer := 0;
BEGIN
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
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_whatsapp_session_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

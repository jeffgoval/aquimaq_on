-- Add UI and shipping configuration columns to store_settings
-- navigation_menu: dynamic menu items for the top bar (label, slug, icon, is_highlighted, category_value, enabled)
-- shipping_rules: category-based shipping restrictions (category, shipping_method, message)
-- seasonal_context: current "season mode" (e.g. PLANTIO_MILHO, COLHEITA_CAFE) or null for auto
-- shipping_restriction_message: global fallback message for restricted products

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS navigation_menu jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS shipping_rules jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seasonal_context text,
  ADD COLUMN IF NOT EXISTS shipping_restriction_message text;

COMMENT ON COLUMN public.store_settings.navigation_menu IS 'Array of menu items: { label, slug, icon?, is_highlighted?, category_value?, enabled? }';
COMMENT ON COLUMN public.store_settings.shipping_rules IS 'Array of rules: { category, shipping_method, message? } e.g. local_pickup_only';
COMMENT ON COLUMN public.store_settings.seasonal_context IS 'Current season mode e.g. PLANTIO_MILHO, COLHEITA_CAFE; null = auto from crop_calendar';
COMMENT ON COLUMN public.store_settings.shipping_restriction_message IS 'Default message shown when product category has shipping restriction';

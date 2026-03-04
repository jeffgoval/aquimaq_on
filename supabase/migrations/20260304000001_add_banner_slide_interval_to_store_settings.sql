ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS banner_slide_interval_ms integer NOT NULL DEFAULT 5000;

COMMENT ON COLUMN public.store_settings.banner_slide_interval_ms
IS 'Tempo de transição (ms) do slider de banners da home.';

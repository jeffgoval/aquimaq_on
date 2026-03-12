-- Optional: show banner only when store seasonal_context matches (null = show in all contexts)
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS seasonal_context text;

COMMENT ON COLUMN public.banners.seasonal_context IS 'When set, banner is shown only when store_settings.seasonal_context matches; null = show in all contexts';

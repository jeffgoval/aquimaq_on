-- Add AI configuration column to store_settings
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS ai_config jsonb DEFAULT '{}'::jsonb;

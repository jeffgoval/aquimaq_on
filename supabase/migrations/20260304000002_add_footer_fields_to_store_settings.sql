-- Adiciona campos usados no footer para conformidade legal e confiança
-- razao_social: razão social da empresa (CDC exige identificação completa)
-- reclame_aqui_url: URL do perfil no Reclame Aqui (muito comum em e-commerces BR)

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS reclame_aqui_url text;

COMMENT ON COLUMN public.store_settings.razao_social IS 'Razão social da empresa (ex: Aquimaq Comércio de Máquinas Ltda.)';
COMMENT ON COLUMN public.store_settings.reclame_aqui_url IS 'URL do perfil no Reclame Aqui (ex: https://www.reclameaqui.com.br/empresa/aquimaq/)';

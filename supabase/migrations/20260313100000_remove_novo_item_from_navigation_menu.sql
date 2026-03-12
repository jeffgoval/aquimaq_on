-- Remove itens com label "Novo item" do menu de navegação (dados na BD, não código).
UPDATE public.store_settings
SET navigation_menu = (
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
  FROM jsonb_array_elements(COALESCE(navigation_menu, '[]'::jsonb)) AS elem
  WHERE trim(lower(elem->>'label')) <> 'novo item'
)
WHERE navigation_menu IS NOT NULL;

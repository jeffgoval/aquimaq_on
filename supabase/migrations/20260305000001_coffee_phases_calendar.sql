-- migration file content
DELETE FROM public.crop_calendar;

INSERT INTO public.crop_calendar (
  culture,
  region,
  month_plant_start,
  month_plant_end,
  month_harvest_start,
  month_harvest_end
) VALUES
('Café - Poda e Esqueletamento', 'Todas', 7, 9, 7, 9),
('Café - Pré-Florada e Florada', 'Todas', 9, 11, 9, 11),
('Café - Chumbinho e Expansão', 'Todas', 12, 12, 1, 2),
('Café - Granação e Maturação', 'Todas', 3, 5, 3, 5),
('Café - Colheita', 'Todas', 5, 8, 5, 8);

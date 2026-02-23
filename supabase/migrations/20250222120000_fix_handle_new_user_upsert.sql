-- Garante que o perfil é sempre criado/atualizado ao cadastrar (evita falha por duplicado ou retry).
-- Usa só coluna name (full_name foi removida em 20250223110000_profiles_drop_full_name.sql).
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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
$function$;

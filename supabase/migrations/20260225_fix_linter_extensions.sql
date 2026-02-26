-- ==============================================================================
-- Migration: Corrigir "Extension in Public" no Linter
-- ==============================================================================
-- O Linter alertou que as extensões 'pg_trgm' e 'vector' estão no schema public,
-- quando a recomendação de segurança é alojá-las em um esquema dedicado.

-- Realocando extensões para o esquema 'extensions' 
-- (que é o padrão nas instâncias modernas do Supabase)

ALTER EXTENSION pg_trgm SET SCHEMA extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

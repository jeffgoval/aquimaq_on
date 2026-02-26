-- ==============================================================================
-- Migration: Corrigir "Function Search Path Mutable" no Linter
-- ==============================================================================
-- O Linter alertou que estas funções não fixam o schema, deixando as portas abertas
-- para manipulação através de schema injetado (Vulnerabilidade de segurança)

-- 1. handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 2. cancel_expired_orders
ALTER FUNCTION public.cancel_expired_orders() SET search_path = public, extensions;

-- 3. recalculate_product_rating (A função pode ter parâmetros diferentes dependendo de como foi criada, usamos drop/replace ou apenas alter se o nome for unico)
-- Como não temos a assinatura exata dos argumentos desta, vamos forçar a alteração de todas as funções com esse nome.
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT oid::regprocedure AS signature 
        FROM pg_proc 
        WHERE proname = 'recalculate_product_rating' 
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'ALTER FUNCTION ' || func_record.signature || ' SET search_path = public';
    END LOOP;
END $$;

-- 4. set_updated_at
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT oid::regprocedure AS signature 
        FROM pg_proc 
        WHERE proname = 'set_updated_at' 
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'ALTER FUNCTION ' || func_record.signature || ' SET search_path = public';
    END LOOP;
END $$;

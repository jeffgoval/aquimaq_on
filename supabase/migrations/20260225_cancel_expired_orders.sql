-- ==============================================================================
-- 1. Habilitar a extensão pg_cron (caso ainda não esteja habilitada)
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- ==============================================================================
-- 2. Criar a Função que realiza o cancelamento
-- ==============================================================================
-- Esta função procura por pedidos criados há mais de 24 horas que ainda estão
-- com status "aguardando_pagamento" e os cancela, atualizando as tabelas
-- orders e payments_history (payments).
CREATE OR REPLACE FUNCTION public.cancel_expired_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com privilégios do criador da função (admin)
AS $$
DECLARE
  expired_orders RECORD;
BEGIN
  -- Percorre todos os pedidos da condição para tratar em lote ou registrar logs
  FOR expired_orders IN 
    SELECT id 
    FROM public.orders 
    WHERE status = 'aguardando_pagamento' 
      AND created_at < NOW() - INTERVAL '24 hours'
  LOOP
    -- 1. Atualizar Pedido
    UPDATE public.orders
    SET 
        status = 'cancelado', 
        updated_at = NOW()
    WHERE id = expired_orders.id;

    -- 2. Atualizar Pagamento associado
    UPDATE public.payments
    SET 
        status = 'cancelled', 
        updated_at = NOW()
    WHERE order_id = expired_orders.id
      -- atualiza só os que também constem ainda como pending ou in_process pra segurança extra.
      AND status IN ('pending', 'in_process', 'aguardando_pagamento');
      
  END LOOP;
END;
$$;

-- ==============================================================================
-- 3. Agendar a função usando pg_cron (A cada 1 hora)
-- ==============================================================================

-- Agenda pra rodar a cada hora certa (ex: 13:00, 14:00, etc)
SELECT cron.schedule(
    'cancel_expired_orders_job', -- Nome único do trabalho agendado
    '0 * * * *',                 -- Expressão Cron (Todo minuto '0' de toda hora)
    $$ SELECT public.cancel_expired_orders(); $$
);

-- ==============================================================================
-- Opcional: Para testar AGORA MESMO como se rodou manual:
-- ==============================================================================
-- SELECT public.cancel_expired_orders();

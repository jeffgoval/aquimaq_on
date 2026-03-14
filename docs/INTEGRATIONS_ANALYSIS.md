# Análise de Integrações — Supabase, Mercado Pago, Melhor Envios

Documento de alinhamento entre o código atual e os padrões oficiais das integrações.

---

## 1. Supabase

### Schema atual (resumo)

- **orders**: `id`, `cliente_id`, `status`, `subtotal`, `shipping_cost`, `total`, `shipping_method`, `shipping_address`, `payment_method`, `payment_details`, `tracking_code`, `tracking_url`, `notes`, `me_order_id`, `shipping_status`, `coupon_id`, `discount_amount`, `scheduled_delivery_date`, `scheduled_delivery_notes`, `stock_decremented`, `stock_restored`, `vendedor_id`, timestamps.
- **payments**: Campos MP (`external_id`, `external_reference`, `mp_preference_id`, `mp_checkout_url`, `status`, `payment_type`, etc.) e `raw_webhook` para auditoria.
- **store_settings**: Endereço de origem (`origin_cep`, `origin_street`, etc.) para Melhor Envios e configuração de pagamento (`max_installments`, `accepted_payment_types`).
- **shipping_quotes**: `order_id`, `me_shipment_id`, `me_label_url`, pacotes e cotações (uso futuro de cotação ME).

### Alterações feitas

- **Migração `add_scheduled_delivery_to_orders`**: Adicionadas colunas `scheduled_delivery_date` (TIMESTAMPTZ) e `scheduled_delivery_notes` (TEXT) em `orders`, alinhando o schema ao payload que a Edge Function `checkout` já envia.
- **Tipos TypeScript** (`src/types/database.ts`): Incluídos `coupon_id`, `discount_amount`, `scheduled_delivery_date`, `scheduled_delivery_notes` e o relacionamento `orders_coupon_id_fkey` em `orders`.

---

## 2. Mercado Pago

### Padrões consultados (documentação oficial)

- **Webhooks**: Notificações com `type: "payment"` e `data.id`; validação via header `x-signature` (ts + v1) e `x-request-id`; manifest `id:{dataId};request-id:{xRequestId};ts:{ts};` com HMAC-SHA256 e secret da aplicação.
- **Preferência (Checkout Pro)**: `external_reference` = ID do pedido interno; `notification_url`; `back_urls`; itens com `currency_id: "BRL"`.

### Conformidade no projeto

| Aspecto | Implementação | Status |
|--------|----------------|--------|
| Validação de webhook | `mercado-pago-webhook`: lê `x-signature` e `x-request-id`, monta manifest, HMAC-SHA256 com `MERCADO_PAGO_WEBHOOK_SECRET` | OK |
| Resposta ao webhook | Retorna 200 após processar; rejeita com 401 se assinatura inválida | OK |
| Pagamento | Busca payment por `data.id`; atualiza `payments` e `orders`; idempotência por `external_reference` (MP payment id) | OK |
| Checkout | Preferência com `external_reference: orderRow.id`, `notification_url`, `back_urls`, itens em BRL, parcelas e tipos de pagamento em `store_settings` | OK |

Nenhuma alteração de schema necessária para MP; fluxo está alinhado à documentação.

---

## 3. Melhor Envios

### Fluxo oficial (resumo)

1. Autenticação (token)
2. Cotação de fretes
3. Compra do frete (carrinho)
4. Pagamento da etiqueta
5. Geração/impressão de etiquetas
6. Status (webhook ou busca ativa)

### Implementação atual

| Etapa | Onde | Observação |
|-------|------|------------|
| Token | `MELHOR_ENVIO_TOKEN` (env) | OK |
| Cotação | (futuro) | Tabela `shipping_quotes` e `store_settings.origin_*` já preparadas |
| Compra | `mercado-pago-webhook` → `createMeShipment()` | POST `/me/cart` com from (store_settings), to (perfil + shipping_address), products, volumes | OK |
| Etiqueta | `melhor-envios-print` | POST `/me/shipment/print` com `orders: [me_order_id]`, `mode: "public/pdf"` | OK |
| Webhook | `melhor-envios-webhook` | Valida `X-ME-Signature` (HMAC-SHA256 no body); mapeia evento → `shipping_status`; atualiza `tracking_code`, `tracking_url` em `orders` por `me_order_id` | OK |

### Schema necessário para ME

- **orders**: `me_order_id`, `shipping_status`, `tracking_code`, `tracking_url` — já existem.
- **store_settings**: `origin_cep`, `origin_street`, `origin_number`, `origin_district`, `origin_city`, `origin_state` (e opcionalmente `origin_complement`) — já existem.

Nenhuma alteração de schema pendente para Melhor Envios.

### Eventos ME mapeados para `shipping_status`

- `order.created` → etiqueta_criada  
- `order.released` → etiqueta_paga  
- `order.generated` → etiqueta_gerada  
- `order.posted` → postado  
- `order.delivered` → entregue  
- `order.cancelled` → cancelado  
- `order.undelivered` → nao_entregue  
- `order.pending` → aguardando_pagamento  

---

## 4. Resumo de alterações realizadas

1. **Supabase (schema)**  
   - Migração aplicada (via MCP) e ficheiro criado localmente: `supabase/migrations/20260315000000_add_scheduled_delivery_to_orders.sql`  
   - Colunas em `orders`: `scheduled_delivery_date`, `scheduled_delivery_notes`.

2. **Tipos TypeScript**  
   - `src/types/database.ts`: `orders` atualizado com `coupon_id`, `discount_amount`, `scheduled_delivery_date`, `scheduled_delivery_notes` e FK para `coupons`.

3. **Integrações**  
   - **Mercado Pago**: Webhook e Checkout alinhados à documentação (assinatura, idempotência, external_reference).  
   - **Melhor Envios**: Carrinho no webhook MP, impressão de etiqueta e webhook de status implementados; schema e configuração de origem já adequados.

---

## 5. Variáveis de ambiente recomendadas

- **Supabase**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Edge Functions).
- **Mercado Pago**: `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`.
- **Melhor Envios**: `MELHOR_ENVIO_TOKEN` (nome correto: singular "ENVIO"; não confundir com o webhook secret), `MELHOR_ENVIOS_WEBHOOK_SECRET`, `PRODUCTION_MELHOR_ENVIO` (opcional, para produção).
- **Origem (fallback)**: `CEP_ORIGEM` (se não houver em `store_settings`).

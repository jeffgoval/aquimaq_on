# Integração Mercado Pago

## Fluxo

1. **Checkout:** O utilizador clica em "Pagar com Mercado Pago" no carrinho. O front chama a Edge Function `checkout` com JWT e payload (ordem, itens, pagador, `back_url_base`). A função cria o registo em `orders` e a preferência no Mercado Pago, e devolve `order_id` e `checkout_url`.
2. **Redirect:** O front redireciona o utilizador para `checkout_url` (ambiente Mercado Pago).
3. **Pagamento:** O utilizador paga no Mercado Pago; o MP redireciona para as URLs de sucesso/falha/pendente (derivadas de `back_url_base`).
4. **Webhook:** O Mercado Pago envia uma notificação para a Edge Function `mercado-pago-webhook`. A função obtém o pagamento na API MP e faz upsert em `payments` (por `external_reference`). Responde sempre 200 para o MP não reenviar.

## Variáveis de ambiente (Supabase Edge)

Configurar em **Supabase Dashboard → Project Settings → Edge Functions → Secrets** (ou via CLI: `supabase secrets set`).

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `MERCADO_PAGO_ACCESS_TOKEN` | Sim | Token de acesso do Mercado Pago (produção ou teste). |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Não | Se definido, o webhook valida o header `x-signature` (HMAC SHA256). |

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetados automaticamente pelo Supabase.

## Schema (tabelas existentes)

- **orders:** `id`, `cliente_id`, `status`, `subtotal`, `shipping_cost`, `total`, `shipping_method`, `shipping_address`, `payment_method`, etc. A função `checkout` insere aqui com `status = 'aguardando_pagamento'` e `payment_method = 'mercado_pago'`.
- **payments:** `id`, `order_id` (FK para `orders`), `external_reference` (UNIQUE – id do pagamento MP), `external_id`, `status` (enum: pending, approved, rejected, refunded, cancelled, in_process, charged_back), `amount`, `created_at`, `updated_at`. O webhook preenche `order_id`, `external_reference`, `external_id`, `status`, `amount`, `updated_at` (upsert por `external_reference`).

## Deploy das funções

1. **checkout** – com verificação JWT (utilizador autenticado):
   ```bash
   supabase functions deploy checkout
   ```

2. **mercado-pago-webhook** – sem JWT (chamada pelo Mercado Pago):
   ```bash
   supabase functions deploy mercado-pago-webhook --no-verify-jwt
   ```

3. **Secrets** (a partir de um ficheiro `.env` com as variáveis):
   ```bash
   supabase secrets set MERCADO_PAGO_ACCESS_TOKEN="$(grep MERCADO_PAGO_ACCESS_TOKEN .env | cut -d= -f2-)"
   supabase secrets set MERCADO_PAGO_WEBHOOK_SECRET="$(grep MERCADO_PAGO_WEBHOOK_SECRET .env | cut -d= -f2-)"
   ```
   No Windows (PowerShell) pode usar o script `scripts/setup-mercado-pago.ps1`.

Não é necessário `db push`: as tabelas `orders` e `payments` já existem no projeto.

## Checklist de teste

- [ ] Credenciais de teste do Mercado Pago configuradas (`MERCADO_PAGO_ACCESS_TOKEN` de teste).
- [ ] Cartão de teste: por exemplo 5031 4332 1540 6351 (Mastercard teste MP).
- [ ] `back_url_base` em produção deve ser o domínio real (ex.: `https://seudominio.com`); o redirect de sucesso/falha/pendente usa `/pagamento/sucesso`, `/pagamento/falha`, `/pagamento/pendente`.
- [ ] A URL de notificação do webhook (`SUPABASE_URL/functions/v1/mercado-pago-webhook`) deve ser acessível pela internet (Supabase expõe automaticamente; em local dev usar tunnel, ex.: ngrok, e configurar essa URL no painel MP).
- [ ] Após um pagamento de teste, verificar em `payments` que existe um registo com `order_id` correto e `status` atualizado.

## Resolução de problemas

- **401 em `mercado-pago-create-preference`:** Esta URL deixou de ser usada. A aplicação chama apenas a função **checkout**. O erro indica build em cache ou a função antiga ainda deployada. Fazer: (1) deploy da função **checkout** (`supabase functions deploy checkout`); (2) no Supabase Dashboard, remover a função `mercado-pago-create-preference` se existir; (3) rebuild da app (`npm run build`) e hard refresh no browser (Ctrl+Shift+R) ou limpar cache.
- **401 em `checkout`:** Sessão expirada ou inválida. A app trata com signOut e redirect para login; o utilizador deve iniciar sessão novamente.
- **Invalid Refresh Token / Refresh Token Not Found:** Sessão inválida no Supabase Auth. Fazer logout e login de novo; em desenvolvimento, limpar dados do site (Application → Storage) para o domínio do Supabase pode ser necessário.

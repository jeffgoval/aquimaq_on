# Arquitetura real: .env, Supabase, n8n, VPS

Documento com base no que está no repositório, no `.env` e no Supabase (MCP). n8n e VPS não têm MCP no Cursor; o fluxo é descrito conforme o código e as configs.

---

## 1. Variáveis de ambiente (`.env` na raiz)

O frontend e scripts locais usam o `.env` (não versionado). As Edge Functions do Supabase **não** leem o `.env` do repo; em produção usam **Supabase Secrets** (Dashboard → Project Settings → Edge Functions → Secrets).

| Grupo | Variável | Usado por |
|-------|----------|-----------|
| **Supabase** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Frontend (env.ts) |
| | `VITE_SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_ACESS_TOKEN` | (acesso admin / chamadas privilegiadas) |
| **Mercado Pago** | `VITE_MERCADO_PAGO_PUBLIC_KEY` | Frontend |
| | `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET` | Edge Functions (checkout, mercado-pago-webhook) — configurar também nos **Supabase Secrets** |
| **Melhor Envios** | `MELHOR_ENVIOS_CLIENT_ID`, `MELHOR_ENVIOS_CLIENT_SECRET`, `MELHOR_ENVIOS_TOKEN_SANDBOX` | (local / integração) — em produção: `MELHOR_ENVIO_TOKEN`, etc. nos Supabase Secrets |
| **VPS (Hostinger)** | Hostname, IP, SSH, `VPS_TOKEN_API` | Acesso à VPS; n8n pode estar a correr aqui |
| **Vercel** | `token_vercel_aquimaq` | Deploy frontend |
| **OpenAI** | `token_api` | (local / testes) — em produção: `OPENAI_API_KEY` nos Supabase Secrets (ex.: process-product-document, ai-chat) |

**Chatwoot:** não existe no `.env`. As variáveis do Chatwoot (`CHATWOOT_URL`, `CHATWOOT_API_TOKEN`, `CHATWOOT_ACCOUNT_ID`, `CHATWOOT_WHATSAPP_INBOX_ID`) existem apenas nos **Supabase Secrets** e são lidas pela Edge Function `whatsapp-send`.

---

## 2. Supabase (projeto aquimaq)

- **Project ID / ref:** `bzicdqrbqykypzesxayw` (igual ao usado no MCP e no `.env`).
- **Edge Functions (existentes):** checkout, mercado-pago-create-preference, mercado-pago-webhook, melhor-envios-quote, melhor-envios-webhook, melhor-envios-print, process-product-document, **whatsapp-send**, **detect-abandoned-carts**.
- **Tabelas relevantes para n8n/Chatwoot:** `n8n_webhook_logs`, `cart_sessions`, `whatsapp_templates`, `orders`, `profiles`, etc.

Chamadas às Edge Functions em produção usam a URL do projeto e, quando exigido, `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`. A service role key pode estar no `.env` (para testes locais ou para o n8n chamar o Supabase).

---

## 3. Fila `n8n_webhook_logs` — origem dos eventos

A tabela `n8n_webhook_logs` (id, event_type, payload, status, created_at, processed_at) é alimentada por:

### 3.1 Trigger na tabela `orders` (`notify_order_change`)

- **INSERT:** `event_type = 'order.created'`, payload = linha do pedido.
- **UPDATE (mudança de status):** `event_type = 'order.' || NEW.status`, por exemplo:
  - `order.pago`
  - `order.em_separacao`
  - `order.enviado`
  - etc. (todos os status da tabela `orders`).

### 3.2 Trigger na tabela `products` (`notify_stock_low`)

- **event_type:** `stock.low` quando stock desce para ≤ 5.

### 3.3 Edge Function `detect-abandoned-carts` (chamada pelo n8n em schedule)

- **event_type:** `cart.abandoned` — carrinho abandonado (payload: user_id, phone, name, email, items, subtotal, item_count, cart_updated_at).
- **event_type:** `order.follow_up` — pedido em aguardando_pagamento há mais de X horas (payload: order_id, user_id, phone, name, email, total, created_at).

O n8n que faz poll a `n8n_webhook_logs` deve tratar **todos** os `event_type` que forem usados para notificação (incluindo `order.pago`, `order.enviado`, `order.em_separacao`, etc.), e não apenas `cart.abandoned` e `order.follow_up`. A documentação em `configuration-chatwoot-n8n.md` foi alinhada com esta lista.

---

## 4. Agente IA com OpenAI (no código)

A aplicação tem **configuração de agente IA com OpenAI** guardada na BD e uma UI no Admin:

| Onde | O quê |
|------|--------|
| **store_settings.ai_config** | JSON com `model` (gpt-4o-mini, gpt-4o, gpt-4.1), `system_prompt`, `temperature`. Definido no Admin → **Config. IA** (Assistente Virtual IA). |
| **AdminAISettings.tsx** | Tela que lê/grava `ai_config` em `store_settings`. Texto: "Configura o comportamento do chat automático com clientes." |
| **RAG** | `ragService.matchKnowledge()` + RPC `match_knowledge` (pgvector) para contexto com bulas/manuais. A ingestão é feita pela Edge Function `process-product-document` (OpenAI embeddings). |
| **OPENAI_API_KEY** | Usada em `process-product-document` (embeddings). Para um agente que chame o chat da OpenAI, é preciso ter a chave na Edge Function que fizer essas chamadas (ex.: uma função `ai-chat` ou no n8n). |

Ou seja: o **modelo, prompt e temperatura** do assistente estão no código (Admin + store_settings); o **RAG** está no código (ragService + ai_knowledge_base). Quem **invoca** a API da OpenAI com esse config (e opcionalmente com o contexto RAG) pode ser uma Edge Function (ex.: `ai-chat`, que não existe neste repositório) ou o **n8n** (workflow que lê `ai_config` e chama OpenAI). O `.env` tem `token_api` (OpenAI); em produção a chave costuma estar nos Supabase Secrets para as funções.

---

## 5. Fluxo n8n (resumo)

- **n8n** não está configurado como MCP no Cursor; na configuração do Claude há referência a n8n na VPS (ex.: `72.61.60.210:32768`).
- **Credenciais:** o n8n usa a URL do Supabase e a **Service Role Key** (do `.env` ou credenciais do n8n) para:
  - Chamar a Edge Function **detect-abandoned-carts** (schedule).
  - Chamar a Edge Function **whatsapp-send** (envio de mensagens via Chatwoot).
  - Ler/atualizar a tabela **n8n_webhook_logs** (Postgres).
- **Chatwoot:** o envio WhatsApp é feito pela `whatsapp-send`, que lê `CHATWOOT_*` dos **Supabase Secrets**. O pré-atendimento (IA) é feito no **n8n** (agente de IA); no Chatwoot usa-se token de **Agent Bot** para as conversas não caírem em agente humano.

---

## 6. VPS

- Referência no `.env`: hostname, IP, utilizador SSH, `VPS_TOKEN_API`. Não existe MCP para a VPS no Cursor; acesso é manual ou por scripts que usam essas variáveis.

---

## 7. Resumo

| Onde | O quê |
|------|--------|
| **.env** | Supabase (URL, anon, service role), Mercado Pago, Melhor Envios, VPS, Vercel, OpenAI. **Sem** CHATWOOT. |
| **Supabase Secrets** | CHATWOOT_* (whatsapp-send), MERCADO_PAGO_*, MELHOR_ENVIO_*, OPENAI_API_KEY, etc., para Edge Functions. |
| **n8n** | Schedule → detect-abandoned-carts; poll → n8n_webhook_logs → montar mensagem → whatsapp-send; agente de IA para pré-atendimento (webhook Chatwoot). |
| **n8n_webhook_logs** | Eventos: order.created, order.{status}, stock.low (triggers); cart.abandoned, order.follow_up (detect-abandoned-carts). |
| **Agente IA (OpenAI)** | Config em `store_settings.ai_config` (model, system_prompt, temperature), editável em Admin → Config. IA. RAG: `match_knowledge` + `ragService`. Quem chama a API OpenAI com esse config pode ser Edge Function (ex. ai-chat) ou n8n. |

# Melhor Envios — Webhook de rastreio (tracking/status)

Objetivo: **preencher automaticamente** no Admin o `tracking_code` e o `shipping_status` dos pedidos, sem o vendedor precisar copiar/colar do painel do Melhor Envios.

---

## 1. O que o webhook atualiza

A Edge Function `supabase/functions/melhor-envios-webhook` atualiza a tabela `orders` pelo `me_order_id`:

- `orders.shipping_status` (mapeado a partir do `event`)
- `orders.tracking_code` (de `data.tracking` ou `data.self_tracking`)
- `orders.tracking_url` (de `data.tracking_url`)

---

## 2. URL do webhook

No painel do Melhor Envios (Developer → Webhooks), cadastre a URL:

- `https://<PROJECT_REF>.functions.supabase.co/melhor-envios-webhook`

Exemplo (aquimaq):

- `https://bzicdqrbqykypzesxayw.functions.supabase.co/melhor-envios-webhook`

---

## 3. Assinatura (HMAC) — **obrigatório para eventos reais**

### 3.1 Secret no Supabase

Configure a secret no Supabase (Project Settings → Edge Functions → Secrets):

- `MELHOR_ENVIOS_WEBHOOK_SECRET`

### 3.2 Header esperado

Eventos reais do Melhor Envios devem vir com:

- Header: `X-ME-Signature`
- Valor: HMAC-SHA256 do **corpo bruto** da requisição (base64), usando `MELHOR_ENVIOS_WEBHOOK_SECRET` como chave.

Sem esse header, a função **não processa** o evento (não atualiza pedido).

---

## 4. Por que o “teste do cadastro” do ME não pode dar 401

O Melhor Envios costuma fazer uma **requisição de teste** ao salvar o webhook e ela pode vir **sem assinatura**.

Para não bloquear o cadastro:

- A Edge Function responde **200 OK** quando **não há** `X-ME-Signature` (**ignora**)
- A Edge Function responde **200 OK** quando `X-ME-Signature` vier **inválida** (**ignora**)

Isso garante:

- **Cadastro do webhook passa**
- **Segurança dos eventos reais permanece** (só atualiza com assinatura válida)

---

## 5. Checklist rápido

- [ ] `melhor-envios-webhook` deployada e ACTIVE no Supabase
- [ ] Secret `MELHOR_ENVIOS_WEBHOOK_SECRET` configurada no Supabase
- [ ] Webhook cadastrado no painel do Melhor Envios com a URL correta
- [ ] Assinatura habilitada no Melhor Envios usando a **mesma secret**


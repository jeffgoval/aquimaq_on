# Configuração necessária (fora do código) — Chatwoot + n8n

Checklist para ativar carrinhos abandonados e follow-up de pedidos via WhatsApp (Chatwoot) e automação n8n.

---

## 1. Secrets no Supabase (Edge Functions)

**Onde:** Supabase Dashboard → Project Settings → Edge Functions → Secrets  
Ou via CLI: `supabase secrets set CHATWOOT_URL="https://app.chatwoot.com"` (e os demais).

| Secret | Descrição | Usado por |
|--------|-----------|-----------|
| `CHATWOOT_URL` | URL base do Chatwoot (ex: `https://app.chatwoot.com`) | Edge Function `whatsapp-send` |
| `CHATWOOT_API_TOKEN` | User Access Token do agente/bot no Chatwoot | `whatsapp-send` |
| `CHATWOOT_ACCOUNT_ID` | ID da conta Chatwoot | `whatsapp-send` |
| `CHATWOOT_WHATSAPP_INBOX_ID` | ID da caixa de entrada WhatsApp no Chatwoot | `whatsapp-send` |

**Nota:** A função `detect-abandoned-carts` usa apenas `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`, já injetados pelo Supabase; não precisa de secrets adicionais.

---

## 2. Migration da tabela `cart_sessions`

**Ficheiro:** `supabase/migrations/20260312000000_cart_sessions.sql`

- Cria a tabela `cart_sessions` (user_id, items, subtotal, item_count, updated_at, abandonment_notified_at).
- Depende da função `set_updated_at()` já definida no schema base.

**Como aplicar:**

- **CLI:** no diretório do projeto com Supabase configurado:
  ```bash
  npx supabase link --project-ref <project-ref>   # se ainda não estiver linkado
  npx supabase db push
  ```
- **Dashboard:** SQL Editor → colar o conteúdo da migration e executar.

A tabela `n8n_webhook_logs` já existe pela migration `20260309300000_n8n_webhook_logs.sql`; não é necessário aplicá-la de novo se já foi feita.

---

## 3. Deploy das Edge Functions

**Comando (no diretório do projeto):**

```bash
npx supabase functions deploy whatsapp-send
npx supabase functions deploy detect-abandoned-carts
```

Ou em uma linha:

```bash
npx supabase functions deploy whatsapp-send detect-abandoned-carts
```

**Requisitos:**

- Projeto linkado (`supabase link`) e login (`supabase login`) se usar CLI.
- Secrets do ponto 1 definidos antes de chamar `whatsapp-send`; caso contrário a função responde 503.

---

## 4. Workflow n8n #1 — Schedule → detect-abandoned-carts

**Objetivo:** A cada 30 minutos, chamar a Edge Function que detecta carrinhos abandonados e pedidos para follow-up e enfileira eventos em `n8n_webhook_logs`.

**Importação:** Podes importar o workflow a partir do ficheiro [docs/n8n-workflow-1-detect-abandoned-carts.json](n8n-workflow-1-detect-abandoned-carts.json) (n8n: menu → Import from File). Depois configura a credencial HTTP Header Auth com a Service Role Key e substitui `SEU_PROJECT_REF` na URL.

**Fluxo:**

1. **Trigger:** Schedule — a cada 30 min.
2. **HTTP Request:**
   - **URL:** `https://<PROJECT_REF>.supabase.co/functions/v1/detect-abandoned-carts`
   - **Method:** POST.
   - **Headers:** `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` (obrigatório).
3. Resposta: `{ ok: true, abandoned_carts: number, pending_orders: number }`.

---

## 5. Workflow n8n #2 — Poll n8n_webhook_logs → montar mensagem → whatsapp-send

**Objetivo:** Processar eventos da fila `n8n_webhook_logs` (event_type `cart.abandoned` ou `order.follow_up`), montar a mensagem e enviar via Edge Function `whatsapp-send`.

**Importação:** Importa o workflow a partir de [docs/n8n-workflow-2-poll-and-whatsapp-send.json](n8n-workflow-2-poll-and-whatsapp-send.json). Configura:
- Credencial **Postgres** com a connection string do Supabase (Dashboard → Settings → Database). Usa a mesma para os nós “Ler pendentes” e “Marcar processado”.
- No nó **whatsapp-send**, substitui `SEU_PROJECT_REF` na URL. No nó **Montar msg carrinho** / **Montar msg pedido** (Code), substitui `SEU_DOMINIO.com` pela URL da loja.
- Para o UPDATE em “Marcar processado” receber o `id`, ativa no nó HTTP Request **whatsapp-send** a opção que inclui os dados de entrada no output (ex.: “Include Input in Output” ou equivalente na tua versão do n8n). Caso contrário, o `$json.id` no UPDATE não estará disponível.

**Fluxo:**

1. **Trigger:** Schedule (ex: a cada 5 min).
2. **Postgres:** SELECT em `n8n_webhook_logs` WHERE `status = 'pending'` ORDER BY `created_at` LIMIT 10.
3. **Split In Batches** (tamanho 1) → por cada item: **IF** por `event_type` → **Code** para montar mensagem (carrinho ou pedido) → **HTTP Request** whatsapp-send → **Postgres** UPDATE `status = 'processed'`, `processed_at = now()` WHERE `id = $json.id` → volta ao batch para o próximo.
4. Mensagens: carrinho abandonado com link para o carrinho; lembrete de pedido com total e link para “meus-pedidos”.

**Estrutura dos payloads (para montar as mensagens no n8n):**

- **cart.abandoned:**  
  `user_id`, `phone`, `name`, `email`, `items` (array), `subtotal`, `item_count`, `cart_updated_at`

- **order.follow_up:**  
  `order_id`, `user_id`, `phone`, `name`, `email`, `total`, `created_at`

---

## 6. Painel Admin — Gestão de mensagens WhatsApp

No painel Admin (menu **WhatsApp**, apenas admin/gerente) existe uma página para:

- **Modelos para submissão à Meta:** editar o texto dos modelos (`cart_abandoned`, `order_follow_up`), estado (rascunho / submetido / aprovado) e notas. Estes textos servem de referência para submissão à Meta como templates aprovados.
- **Histórico de envios:** listagem da fila `n8n_webhook_logs` (tipo, destinatário, status, datas) para acompanhar o que foi enviado ou está pendente.

É necessário aplicar a migration `20260312100000_whatsapp_templates_and_admin_logs.sql` (cria a tabela `whatsapp_templates` e dá permissão de leitura a admin/gerente em `n8n_webhook_logs`).

---

## Ordem recomendada

1. Aplicar a migration `20260312000000_cart_sessions.sql`.
2. Aplicar a migration `20260312100000_whatsapp_templates_and_admin_logs.sql`.
3. Definir os 4 secrets do Chatwoot no Supabase.
4. Fazer deploy de `whatsapp-send` e `detect-abandoned-carts`.
5. Configurar no n8n o workflow #1 (schedule → detect-abandoned-carts).
6. Configurar no n8n o workflow #2 (poll → montar mensagem → whatsapp-send).
7. Usar o painel Admin → WhatsApp para gerir modelos e consultar o histórico de envios.

Assim, a tabela existe, as funções estão publicadas com os secrets corretos, e os workflows n8n passam a alimentar a fila e a consumi-la enviando mensagens pelo Chatwoot.

# Configuração necessária (fora do código) — Chatwoot + n8n

Checklist para ativar carrinhos abandonados e follow-up de pedidos via WhatsApp (Chatwoot) e automação n8n.

**Arquitetura real (.env, Supabase, n8n, VPS):** ver [ARCHITECTURE-ENV-SUPABASE-N8N.md](ARCHITECTURE-ENV-SUPABASE-N8N.md).

---

## 1. Secrets no Supabase (Edge Functions)

**Onde:** Supabase Dashboard → Project Settings → Edge Functions → Secrets  
Ou via CLI: `supabase secrets set CHATWOOT_URL="https://app.chatwoot.com"` (e os demais).

| Secret | Descrição | Usado por |
|--------|-----------|-----------|
| `CHATWOOT_URL` | URL base do Chatwoot (ex: `https://app.chatwoot.com`) | Edge Function `whatsapp-send` |
| `CHATWOOT_API_TOKEN` | Token de um **Agent Bot** no Chatwoot (não de agente humano). O pré-atendimento é feito pelo **agente de IA no n8n**; o bot no Chatwoot serve para a conversa não ser atribuída a humano. | `whatsapp-send` |
| `CHATWOOT_ACCOUNT_ID` | ID da conta Chatwoot | `whatsapp-send` |
| `CHATWOOT_WHATSAPP_INBOX_ID` | ID da caixa de entrada WhatsApp no Chatwoot | `whatsapp-send` |

**Nota:** As variáveis Chatwoot **não** estão no `.env` do projeto; são configuradas apenas nos **Supabase Secrets** (Edge Functions). A função `detect-abandoned-carts` usa apenas `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`, já injetados pelo Supabase.

### Por que usar token do Agent Bot (e não de agente humano)?

O **pré-atendimento é feito pelo agente de IA no n8n** (workflow com nós de IA/LLM). O Chatwoot é o canal (WhatsApp); o n8n recebe eventos do Chatwoot (webhook) e responde via API.  
Se `CHATWOOT_API_TOKEN` for o **User Access Token** de um agente humano, o Chatwoot atribui a conversa a esse agente sempre que a Edge Function `whatsapp-send` cria/envia mensagem. Desativar "atribuição automática" na inbox não evita isso — a atribuição vem do **dono do token**.  
Usando o token de um **Agent Bot** no Chatwoot, as conversas criadas pela API ficam com o bot (ou sem assignee), e o **workflow n8n** (com o agente de IA) pode processá-las via webhook e responder; quando for preciso, o n8n transfere para agente humano (regras no Chatwoot ou API de assignment).

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

**Importação:** Podes importar o workflow a partir do ficheiro [docs/n8n-workflow-1-detect-abandoned-carts.json](n8n-workflow-1-detect-abandoned-carts.json) (n8n: menu → Import from File). Depois configura a credencial HTTP Header Auth com a **Supabase Service Role Key** (ex.: `VITE_SUPABASE_SERVICE_ROLE_KEY` do `.env` ou credenciais do n8n) e a URL `https://bzicdqrbqykypzesxayw.supabase.co/functions/v1/detect-abandoned-carts` (ou usa `SEU_PROJECT_REF` se for outro projeto).

**Fluxo:**

1. **Trigger:** Schedule — a cada 30 min.
2. **HTTP Request:**
   - **URL:** `https://<PROJECT_REF>.supabase.co/functions/v1/detect-abandoned-carts`
   - **Method:** POST.
   - **Headers:** `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` (obrigatório).
3. Resposta: `{ ok: true, abandoned_carts: number, pending_orders: number }`.

---

## 5. Workflow n8n #2 — Poll n8n_webhook_logs → montar mensagem → whatsapp-send

**Objetivo:** Processar eventos da fila `n8n_webhook_logs`, montar a mensagem e enviar via Edge Function `whatsapp-send`.

**Eventos na fila (origem):**
- **Triggers na BD:** `order.created`, `order.pago`, `order.em_separacao`, `order.enviado`, etc. (trigger `notify_order_change` na tabela `orders`); `stock.low` (trigger `notify_stock_low` em `products`).
- **Edge Function detect-abandoned-carts:** `cart.abandoned`, `order.follow_up`.

O workflow no n8n deve tratar cada `event_type` que quiseres notificar (ex.: enviar WhatsApp para order.pago, order.enviado, cart.abandoned, order.follow_up, etc.). O payload varia por tipo; para whatsapp-send é necessário ter `phone` e mensagem montada.

**Importação:** Importa o workflow a partir de [docs/n8n-workflow-2-poll-and-whatsapp-send.json](n8n-workflow-2-poll-and-whatsapp-send.json). Configura:
- Credencial **Postgres** com a connection string do Supabase (Dashboard → Settings → Database). Usa a mesma para os nós “Ler pendentes” e “Marcar processado”.
- No nó **whatsapp-send**, URL: `https://bzicdqrbqykypzesxayw.supabase.co/functions/v1/whatsapp-send` (projeto aquimaq). No nó de montar mensagem (Code), usa a URL da loja.
- Para o UPDATE em “Marcar processado” receber o `id`, ativa no nó HTTP Request **whatsapp-send** a opção que inclui os dados de entrada no output (ex.: “Include Input in Output” ou equivalente na tua versão do n8n). Caso contrário, o `$json.id` no UPDATE não estará disponível.

**Fluxo:**

1. **Trigger:** Schedule (ex: a cada 5 min).
2. **Postgres:** SELECT em `n8n_webhook_logs` WHERE `status = 'pending'` ORDER BY `created_at` LIMIT 10.
3. **Split In Batches** (tamanho 1) → por cada item: **IF** por `event_type` → **Code** para montar mensagem (carrinho ou pedido) → **HTTP Request** whatsapp-send → **Postgres** UPDATE `status = 'processed'`, `processed_at = now()` WHERE `id = $json.id` → volta ao batch para o próximo.
4. Mensagens: carrinho abandonado com link para o carrinho; lembrete de pedido com total e link para “meus-pedidos”.

**Estrutura dos payloads (para montar as mensagens no n8n):**

- **cart.abandoned** (detect-abandoned-carts):  
  `user_id`, `phone`, `name`, `email`, `items`, `subtotal`, `item_count`, `cart_updated_at`

- **order.follow_up** (detect-abandoned-carts):  
  `order_id`, `user_id`, `phone`, `name`, `email`, `total`, `created_at`

- **order.created**, **order.pago**, **order.em_separacao**, **order.enviado**, etc. (trigger `notify_order_change`):  
  payload = linha completa do pedido (ex.: `id`, `status`, `cliente_id`, `total`, `created_at`, …). O telefone não vem no payload; o n8n deve obter via `profiles` (cliente_id) ou outro fluxo.

- **stock.low** (trigger `notify_stock_low`):  
  `product_id`, `product_name`, `stock`

Ver também [ARCHITECTURE-ENV-SUPABASE-N8N.md](ARCHITECTURE-ENV-SUPABASE-N8N.md) para a lista completa de eventos e origem.

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
3. No Chatwoot: criar um Agent Bot e obter o **token do bot** (secção 7). O pré-atendimento (IA) fica no n8n; o bot no Chatwoot serve para a conversa não ser atribuída a humano.
4. Definir os 4 secrets do Chatwoot no Supabase — usar o **token do Agent Bot** em `CHATWOOT_API_TOKEN`, não o token de um agente humano.
5. Fazer deploy de `whatsapp-send` e `detect-abandoned-carts`.
6. Configurar no n8n o workflow #1 (schedule → detect-abandoned-carts).
7. Configurar no n8n o workflow #2 (poll → montar mensagem → whatsapp-send).
8. Usar o painel Admin → WhatsApp para gerir modelos e consultar o histórico de envios.

Assim, a tabela existe, as funções estão publicadas com os secrets corretos, e os workflows n8n passam a alimentar a fila e a consumi-la enviando mensagens pelo Chatwoot.

---

## 7. Workflow n8n #3 — Agente IA (Chat Bot V2)

**Workflow:** `Aquimaq Chat Bot V2 (AI Agent)` — ID `QKfXG7uuynvQCbcH`
**Status:** Ativo
**Webhook URL:** `https://n8n.aquimaq.com.br/webhook/aquimaq-chat-v2?secret=<WEBHOOK_SECRET>`

### O que faz

Recebe mensagens do Chatwoot (WhatsApp + widget do site), responde com IA usando o catálogo de produtos em tempo real e transfere para atendente humano quando necessário.

### Fluxo completo

```
Webhook Chatwoot
  → Verificar Token        (valida ?secret= com $env.WEBHOOK_SECRET)
  → Filtra Mensagem        (só mensagens incoming de clientes; descarta bot/agente)
  → Buscar Config IA       (GET store_settings → ai_config: model, system_prompt, max_catalog_products)
  → Buscar Histórico       (GET Chatwoot API → últimas mensagens da conversa)
  → Montar Contexto        (Code: monta userMsg, systemPrompt com histórico e limite de catálogo)
  → AI Agent               (Tools Agent typeVersion 1.7 — OpenAI Functions)
      ├─ OpenAI Chat Model (credencial n8n)
      ├─ Window Buffer Memory (sessionKey = conversationId)
      └─ buscar_produtos   (GET Supabase products — anon key na URL)
  → Processar Resposta     (Code: extrai output, detecta TRANSFERIR_HUMANO)
  → Precisa de Humano?     (IF)
      ├─ true  → Avisar Transferência → Transferir p/ Pendente
      └─ false → Responder Cliente
```

### Configuração crítica do AI Agent

| Campo | Valor |
|---|---|
| `typeVersion` | `1.7` — NÃO alterar para 3.x (quebra sub-nós) |
| `promptType` | `define` |
| `text` | `={{ $('Montar Contexto').first().json.userMsg }}` |
| `options.systemMessage` | texto estático (system prompt completo) |
| `options.maxIterations` | `10` |

> **Importante:** O campo `options.systemMessage` aceita apenas texto estático em `typeVersion: 1.7`. Expressões `={{ }}` não são avaliadas nesse campo nessa versão. Quando o admin alterar o system prompt em **Admin → Config. IA**, é necessário rodar o script `/tmp/fix_static_system.py` no VPS para sincronizar com o n8n. O Supabase (`store_settings.ai_config.system_prompt`) continua sendo a fonte de verdade — serve tanto para o V1 (workflow legado com Code nodes) quanto para documentação; o V2 usa o valor copiado estaticamente no nó.

### Ferramenta `buscar_produtos`

- Tipo: `@n8n/n8n-nodes-langchain.toolHttpRequest`
- URL: `https://bzicdqrbqykypzesxayw.supabase.co/rest/v1/products?apikey=<ANON_KEY>&is_active=eq.true&select=name,price,stock,category,brand&order=stock.desc,name.asc&limit=30`
- Autenticação: **anon key embutida na URL** (não usa headers — expressões não funcionam em headers do `toolHttpRequest`)
- Sem headers adicionais

### Deduplicação

Tabela `n8n_webhook_logs` com coluna `message_id TEXT UNIQUE`:
- Antes de processar: `GET ?message_id=eq.{id}` — se existe, para
- Após processar: `POST` inserindo `message_id`, `event_type=chat_message`, `status=processed`

### Env vars necessárias no n8n (Settings → Environment Variables)

| Variável | Uso |
|---|---|
| `WEBHOOK_SECRET` | Valida chamadas do Chatwoot em "Verificar Token" |
| `CHATWOOT_ACCESS_TOKEN` | Token do Agent Bot — usado em "Responder Cliente" e "Transferir p/ Pendente" |
| `SUPABASE_SERVICE_KEY` | Acesso ao Supabase em "Buscar Config IA", "Buscar Histórico", "Checar Duplicata", "Registrar Mensagem" |
| `OPENAI_API_KEY` | Credencial OpenAI (configurada nas Credentials do n8n, não como env var) |

### Configurar webhook no Chatwoot

1. Chatwoot → Settings → Integrations → Webhooks → Add new webhook
2. URL: `https://n8n.aquimaq.com.br/webhook/aquimaq-chat-v2?secret=<valor_de_WEBHOOK_SECRET>`
3. Evento: `Message Created`
4. Salvar

### Proteção contra loops

- **Timeout de execução:** `EXECUTIONS_TIMEOUT=120` (env var do container Docker n8n) — mata execuções que ultrapassem 120s
- **Deduplicação:** impede que a mesma mensagem seja processada duas vezes (webhook duplicado do Chatwoot)
- **maxIterations: 10** — o AI Agent para após 10 tentativas de tool use

---

## 8. Agent Bot no Chatwoot (para conversas não irem para agente humano)

O **pré-atendimento (IA) é feito no n8n** (workflow com agente de IA). No Chatwoot precisas de um Agent Bot apenas para que as conversas criadas por `whatsapp-send` **não** fiquem atribuídas a um agente humano — assim o n8n (via webhook do Chatwoot) pode tratar com o agente de IA e só escalar para humano quando for o caso.

1. **Criar um Agent Bot** no Chatwoot: Settings → Agent Bots → Add Agent Bot (pode ser mínimo; a lógica de IA fica no n8n).
2. **Obter o token do Agent Bot**: no Agent Bot criado, gerar/copiar o **API token** do bot (não usar o User Access Token do teu perfil).
3. **Definir o secret** `CHATWOOT_API_TOKEN` no Supabase com esse **token do Agent Bot**.
4. Na **inbox WhatsApp**, manter a atribuição automática desativada (opcional).
5. No **n8n**, o workflow que faz pré-atendimento (agente de IA) recebe eventos do Chatwoot (webhook) e responde via API do Chatwoot; quando precisar transferir para humano, usar a API de assignment do Chatwoot (`POST .../conversations/{id}/assignments`) ou regras de automação no Chatwoot.

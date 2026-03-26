# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server
npm run build        # Production build (tsc + vite build)
npm run type-check   # TypeScript check only (no emit)
npm run preview      # Preview production build locally

# Tests (Node.js built-in test runner via tsx)
npm test             # Run all *.test.ts files once
npm run test:watch   # Re-run on file changes

# Run a single test file
npx tsx --test src/utils/__tests__/cart-calculations.test.ts

# Deploy Edge Functions
npm run deploy:functions  # Deploy todas as funções (respeita supabase/config.toml)
npm run deploy:checkout   # Deploy só o checkout com --no-verify-jwt
```

> **ATENÇÃO:** NUNCA fazer deploy de Edge Functions sem usar os scripts acima ou sem
> passar `--no-verify-jwt` para `checkout`. O padrão do Supabase é `verify_jwt=true`,
> o que causa erro 401 no checkout de produção. O `supabase/config.toml` define isso
> de forma declarativa — não remover.

## Environment

Create `.env` in the project root:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

Validated at startup via `src/config/env.ts` (Zod schema). The dev server will run without these set but all Supabase calls will fail.

## Architecture

### Frontend (React SPA)
- **Stack**: React 18, TypeScript, Vite, TailwindCSS v4, React Router v7, TanStack Query v5
- **Path alias**: `@/` → `src/`
- **Entry**: `src/index.tsx` → `src/App.tsx`
- **Provider stack** (outermost first): `HelmetProvider → StoreProvider → AuthProvider → ToastProvider → CartProvider → WishlistProvider` — composed in `src/providers/index.tsx`

### Routing (`src/App.tsx`)
- Store routes: nested under `MainLayout` (`/`, `/produto/:id`, `/carrinho`, `/conta`, etc.)
- Admin routes: `/admin/*` handled by `AdminGate` component which renders `StaffLoginPage` when unauthenticated, otherwise wraps in `AdminLayout` + `ProtectedRoute`
- All admin/store pages are lazy-loaded

### Role-based Access
Roles: `cliente` (default) | `vendedor` | `gerente` | `admin`
- `ProtectedRoute` component enforces `allowedRoles` per route
- `useAuth()` hook exposes `isAdmin`, `isGerente`, `hasRole(roles[])`
- `vendedor` sees only own records (filtered server-side via RLS + `seller_id` column)

### Supabase Integration
- Single client instance: `src/services/supabase.ts`
- **Do not use `supabase.functions.invoke()`** for the `checkout` Edge Function — it uses raw `fetch` with explicit `Authorization: Bearer <token>` + `apikey` headers (see `src/services/checkoutService.ts`)
- RLS is enabled on all tables; without correct policies, all DB operations silently fail

### Edge Functions (`supabase/functions/`)
All written in Deno/TypeScript. Key functions:
| Function | Notes |
|---|---|
| `checkout` | Deployed `--no-verify-jwt`; recalculates item prices from DB, creates MP preference |
| `mercado-pago-webhook` | Validates HMAC signature; updates order + payment records |
| `mercado-pago-create-preference` | Standalone MP preference creation |
| `melhor-envios-quote` | Returns shipping quotes |
| `melhor-envios-webhook` | Handles shipping events (tracking/status) via ME webhooks |
| `melhor-envios-print` | Generates shipping labels |
| `whatsapp-send` | Sends WhatsApp messages |
| `process-product-document` | PDF → chunks → embeddings (OpenAI) |
| `detect-abandoned-carts` | Scheduled: detects and flags abandoned carts |

#### Melhor Envios: webhook de rastreio (automático)
Para o vendedor **não** precisar copiar/colar o código de rastreio do painel do Melhor Envios:

- Configure no Supabase Secrets a variável **`MELHOR_ENVIOS_WEBHOOK_SECRET`**
- Cadastre o webhook no painel do Melhor Envios apontando para a Edge Function `melhor-envios-webhook`
- **Importante**: eventos reais devem vir assinados com header **`X-ME-Signature`** (HMAC do corpo).
  - A Edge Function **ignora** requisições sem assinatura **ou com assinatura inválida** (retorna 200 apenas para não quebrar a validação/teste de cadastro do ME).
  - Só atualiza `orders.tracking_code`, `orders.tracking_url` e `orders.shipping_status` quando a assinatura for válida.

Ver guia completo em `docs/melhor-envios-webhook.md`.

### Key Services (`src/services/`)
- `checkoutService.ts` — raw fetch to Edge Function (not `supabase.functions.invoke`)
- `chatService.ts` — admin chat: conversations, messages, claim/close/handoff + realtime subscriptions
- `adminService.ts` — dashboard stats, orders management, stock restoration
- `shippingService.ts` — wraps Melhor Envios quote Edge Function
- `storeSettingsService.ts` — reads/writes `store_settings` table

### State Management
- Auth state: `AuthContext` (Supabase session + `profiles` row)
- Cart: `CartProvider` (`src/features/cart/`) — persisted in `localStorage`
- Wishlist: `WishlistContext` — persisted in `localStorage`
- Store settings (logo, name, etc.): `StoreContext`
- Server state: TanStack Query (no explicit QueryClient in providers — check if missing before adding)

### Feature Modules (`src/features/`)
- `catalog/` — product listing, filters, crop calendar, URL-based search params
- `cart/` — cart logic, shipping calculator, address modal, checkout flow

### Database Migrations
Located in `supabase/migrations/`. Apply via Supabase CLI (`supabase db push`) or MCP tools. RLS policies are defined inline in migrations.

### Mercado Pago Integration
- Use `init_point` (production URL) — **never `sandbox_init_point`**, which causes redirect loops
- `checkout_url` returned from the `checkout` Edge Function is what gets used for redirect

### n8n AI Chat Bot (Chatwoot Integration)

Workflow **"Aquimaq Chat Bot V2 (AI Agent)"** — ID `QKfXG7uuynvQCbcH` — at `https://n8n.aquimaq.com.br`.

**Fluxo completo:**
```
Webhook Chatwoot → Verificar Token → Filtra Mensagem → Setar Pendente → Buscar Config IA
→ Buscar Histórico → Montar Contexto → AI Agent → Processar Resposta → Precisa de Humano?
  ├─ sim → Avisar Transferência → Transferir p/ Pendente  (status "open", sem atribuição)
  └─ não → Responder Cliente
```

**Lógica de handoff:**
- Quando o agente inclui `TRANSFERIR_HUMANO` na resposta, `Processar Resposta` detecta e roteia para o branch de handoff
- `Avisar Transferência`: envia mensagem ao cliente ("Vou chamar um atendente...")
- `Transferir p/ Pendente`: `POST /toggle_status` com `{"status": "open"}` — **POST, não PATCH**
- Sem atribuição automática — qualquer vendedor pode pegar a conversa em `/admin/chat`
- `Filtra Mensagem` só passa se `conversation.meta.assignee === null` — após handoff, mensagens novas não chegam mais ao bot

**Configuração dos nodes críticos (AI Agent):**
- `typeVersion`: `1.7` — versão 3.x quebra sub-nodes
- `promptType`: `"define"` — obrigatório para usar o campo `text` com expressão; sem isso o agente procura `chatInput` e falha
- `text`: `={{ $('Montar Contexto').first().json.fullPrompt }}`

**Window Buffer Memory (typeVersion 1.3):**
- `sessionIdType`: `"customKey"` — obrigatório para usar expressão no `sessionKey`; sem isso busca campo `sessionId` no input e falha com "No session ID found"
- `sessionKey`: `={{ $('Montar Contexto').first().json.conversationId }}`

**buscar_produtos tool (toolHttpRequest typeVersion 1.1):**
- URL com `{keyword}` hardcoded diretamente na string (anon key também hardcoded — expressions não funcionam em toolHttpRequest)
- Requer `placeholderDefinitions.values` com `name: "keyword"`, `description` e `type: "string"` — sem isso o agente inventa schema e falha com "Received tool input did not match expected schema"
- Filtro: `name=ilike.*{keyword}*` na URL

**Montar Contexto (Code node):**
- Lê `system_prompt` do Supabase (`Buscar Config IA`) + data/hora atual + histórico da conversa (`Buscar Histórico`) + mensagem do cliente
- Saída: `{ conversationId, fullPrompt, maxProducts }`

**Regras críticas:**
- `options.systemMessage` NÃO avalia expressões em `typeVersion: 1.7` — usar `text` com `fullPrompt`
- **Single source of truth:** `store_settings.ai_config.system_prompt` no Supabase — mudanças refletem imediatamente
- Chatwoot webhook: `POST https://n8n.aquimaq.com.br/webhook/aquimaq-chat-v2?secret=<WEBHOOK_SECRET>`
- Variáveis de ambiente n8n: `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`, `CHATWOOT_ACCESS_TOKEN`, `WEBHOOK_SECRET`, `OPENAI_API_KEY`

**Infraestrutura VPS:**
- n8n roda em Docker Swarm: `docker service update --force aquimaq_n8n` para reiniciar (nunca `docker restart` — quebra roteamento do Traefik/Easypanel)
- SQLite: `/var/lib/docker/volumes/aquimaq_n8n_data/_data/database.sqlite`
- Após editar SQLite direto: sempre `PRAGMA wal_checkpoint(TRUNCATE)` antes de reiniciar
- `workflow_entity.activeVersionId` é o que o n8n executa — editar só `versionId` não tem efeito; manter `versionId = activeVersionId` após patches

**Chatwoot:**
- URL: `https://chatwoot.aquimaq.com.br` — account ID `2`
- Containers: `aquimaq_chatwoot`, `aquimaq_chatwoot-sidekiq`, `aquimaq_chatwoot-db`, `aquimaq_chatwoot-redis`
- API: `/api/v1/accounts/2/conversations/{id}/toggle_status` — método `POST` (não PATCH)
- Statuses relevantes: `pending` (AI respondendo), `open` (aguardando humano na fila)

**To patch workflow JSON:** write Python script to `C:/tmp/`, SCP to VPS (`root@72.61.60.210`), then run. Avoid inline Python via SSH — shell quotes break strings.

### Testing
Uses Node.js built-in `node:test` + `node:assert/strict`. Tests import via `@/` alias (resolved by tsx). No test framework setup files — tests are standalone `.test.ts` files co-located under `__tests__/` directories.

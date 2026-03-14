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
```

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
| `melhor-envios-webhook` | Handles shipping events |
| `melhor-envios-print` | Generates shipping labels |
| `whatsapp-send` | Sends WhatsApp messages |
| `process-product-document` | PDF → chunks → embeddings (OpenAI) |
| `detect-abandoned-carts` | Scheduled: detects and flags abandoned carts |

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

**Critical rules:**
- AI Agent `typeVersion` must be `1.7` — version 3.x breaks sub-nodes (`toolHttpRequest`, `Window Buffer Memory`)
- `options.systemMessage` does NOT evaluate expressions in `typeVersion: 1.7` — use the `text` field with `fullPrompt`
- `fullPrompt` is built in the "Montar Contexto" Code node: system prompt from Supabase + current date/time + opening hours + store address + PIX discount + free shipping threshold + conversation history + userMsg
- `buscar_produtos` tool: anon key embedded in URL (expressions don't work in `toolHttpRequest` headers)
- **Single source of truth:** `store_settings.ai_config.system_prompt` in Supabase — changes reflect immediately without editing n8n
- Deduplication via `n8n_webhook_logs.message_id TEXT UNIQUE`

**To patch workflow JSON:** write Python script to `C:/tmp/`, SCP to VPS (`root@72.61.60.210`), then run. Avoid inline Python via SSH — shell quotes break strings.

### Testing
Uses Node.js built-in `node:test` + `node:assert/strict`. Tests import via `@/` alias (resolved by tsx). No test framework setup files — tests are standalone `.test.ts` files co-located under `__tests__/` directories.

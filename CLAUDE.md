---
description: 
alwaysApply: true
---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aquimaq** — Brazilian agro e-commerce (ferramentas, peças, sementes). Frontend-only SPA backed entirely by Supabase (Postgres + Auth + Storage + Edge Functions).

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm run type-check   # TypeScript check (tsc --noEmit), no emit

# Supabase CLI (Edge Functions)
npx supabase functions deploy checkout --no-verify-jwt
npx supabase functions deploy mercado-pago-webhook --no-verify-jwt
npx supabase functions deploy melhor-envios-quote
npx supabase functions deploy melhor-envios-webhook --no-verify-jwt

npx supabase link --project-ref <ref>
npx supabase db push   # apply migrations
```

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
```

Validated at startup via Zod in `src/config/env.ts` — the app fails fast if these are missing.

Edge Functions secrets (configured in Supabase Project Settings):
- `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `MELHOR_ENVIOS_TOKEN`, `MELHOR_ENVIOS_FROM_CEP`

## Architecture

### Frontend (`src/`)

**Routing** — `src/App.tsx` defines all routes. Routes are in two trees:
- Public store under `MainLayout` (`/`, `/produto/:id`, `/carrinho`, `/conta`, etc.)
- Admin panel under `/admin/*` — protected by `ProtectedRoute` with roles `admin`/`gerente`; lazy-loaded.

**Provider stack** (`src/providers/index.tsx`):
`HelmetProvider → StoreProvider → AuthProvider → CartProvider → ToastProvider → WishlistProvider`

**Contexts:**
- `AuthContext` — Supabase session + `profiles` table row; exposes `isAdmin`, `isGerente`, `hasRole()`
- `CartContext` — cart state persisted to `localStorage`; includes shipping zip + selected option
- `StoreContext` — store settings from Supabase (logo, colors, etc.)
- `ToastContext`, `WishlistContext`

**Feature modules** (`src/features/`):
- `catalog/` — product listing (`HomePage`), product detail (`ProductPage`), filters, hooks for data fetching
- `cart/` — cart UI, `ShippingCalculator`, `CartPage` (checkout entry point), order service

**Services** (`src/services/`):
- `supabase.ts` — typed Supabase client (`Database` generic)
- `checkoutService.ts` — calls Edge Function `checkout` via raw `fetch` with `session.access_token` (NOT `supabase.functions.invoke()`, which sends anon key instead of user token)
- `shippingService.ts` — calls Edge Function `melhor-envios-quote` for carrier quotes; always prepends "Retirada no Balcão" option
- Others: `productService`, `orderService`, `adminService`, `bannerService`, `chatService`, etc.

**Path aliases**: `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`).

**TailwindCSS v4** — uses `@tailwindcss/postcss` plugin. Custom color `agro-*` is used throughout.

### Backend (Supabase Edge Functions — `supabase/functions/`)

| Function | JWT | Description |
|---|---|---|
| `checkout` | `verify_jwt=false` | Creates order + order_items + MP preference; validates user manually via `auth.getUser()` |
| `mercado-pago-webhook` | `verify_jwt=false` | Validates HMAC, updates `payments` and `orders.status` |
| `melhor-envios-quote` | `verify_jwt=true` | Fetches shipping quotes from Melhor Envios API |
| `melhor-envios-webhook` | `verify_jwt=false` | Handles Melhor Envios shipping events |

### Database (Supabase Postgres)

Key tables: `products`, `profiles`, `orders`, `order_items`, `payments`, `chat_conversations`, `chat_messages`, `ai_knowledge_base`.

RLS policies are in `supabase/migrations/`. Without them, all reads/writes fail. Migrations in `supabase/migrations/` starting with `20260225_fix_linter_*` address Supabase linter warnings.

Storage buckets (must be created manually as **public**): `store-assets`, `product-images`, `knowledge-base`.

### Roles
`cliente` (default) | `vendedor` | `gerente` | `admin`

Admin panel is accessible to `admin` and `gerente`. Certain sub-routes (users, settings, knowledge base, chat) require `admin` only.

## Mercado Pago Integration Notes

- Use `init_point` (not `sandbox_init_point`) — sandbox URL causes redirect loops when browser has a real MP session.
- Omit `payer` from the preference — sending a real email with test credentials triggers "Uma das partes é de teste" error.
- Omit `auto_return` in development — it requires a public HTTPS `back_urls.success`.
- The `checkout` Edge Function must be deployed with `--no-verify-jwt`.

## Deploy

Frontend: Vercel (`vercel.json` configures SPA rewrites and asset cache headers).
Backend: Supabase hosted project.

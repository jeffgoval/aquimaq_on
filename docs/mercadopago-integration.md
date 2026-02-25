# Integração Mercado Pago Checkout Pro — Aquimaq

## Visão Geral

Integração completa do Mercado Pago Checkout Pro usando **Supabase Edge Functions** como backend e **React + Vite** no frontend. O fluxo redireciona o comprador para a página de pagamento do Mercado Pago e retorna ao site após a conclusão.

---

## Arquitetura

```
Frontend (React)
  └── checkoutService.ts          → fetch direto com session token
        └── Supabase Edge Function: checkout (v12)
              ├── Autentica usuário via supabase.auth.getUser()
              ├── Cria pedido em orders
              ├── Insere itens em order_items
              ├── Cria preferência na API do Mercado Pago
              └── Salva registro inicial em payments

Mercado Pago → Webhook
  └── Supabase Edge Function: mercado-pago-webhook
        ├── Valida assinatura HMAC
        ├── Consulta pagamento na API do MP
        ├── Atualiza payments
        └── Atualiza orders.status
```

---

## Arquivos Modificados / Criados

### Backend (Edge Functions)

| Arquivo | Descrição |
|---|---|
| `supabase/functions/checkout/index.ts` | Cria pedido + preferência MP + registro de pagamento |
| `supabase/functions/mercado-pago-webhook/index.ts` | Recebe notificações MP e atualiza o banco |

### Frontend

| Arquivo | Descrição |
|---|---|
| `src/services/checkoutService.ts` | Chama a edge function `checkout` via fetch |
| `src/services/orderService.ts` | Busca pedidos do usuário |
| `src/features/cart/components/Cart.tsx` | Botão "Finalizar Compra" com validações |
| `src/features/cart/pages/CartPage.tsx` | Handler do checkout com verificação de estoque |
| `src/features/cart/index.ts` | Exporta `fetchOrders` |

---

## Variáveis de Ambiente

### `.env` (frontend)
```
VITE_SUPABASE_URL=https://<projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
```

### Supabase Edge Functions (configurar em Project Settings > Edge Functions)
```
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...   # Credenciais de teste ou produção
MERCADO_PAGO_WEBHOOK_SECRET=<secret>    # Chave HMAC do webhook MP
SUPABASE_URL=https://<projeto>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

---

## Edge Function: `checkout`

### Configuração de Deploy
```bash
# verify_jwt=false — autenticação feita dentro da função via supabase.auth.getUser()
supabase functions deploy checkout --no-verify-jwt
```

### Por que `verify_jwt=false`?
O `supabase.functions.invoke()` envia o **anon key** no header, não o token do usuário logado. Com `verify_jwt=true`, o gateway do Supabase rejeita com 401. A solução é desabilitar o JWT no gateway e validar o token manualmente dentro da função.

### Fluxo
1. Recebe `Authorization: Bearer <access_token>` do frontend
2. Valida o usuário com `supabase.auth.getUser()`
3. Cria registro em `orders`
4. Insere itens em `order_items` (exclui item de frete)
5. Cria preferência no Mercado Pago sem `payer` e sem `auto_return`
6. Usa `init_point` (não `sandbox_init_point`)
7. Salva registro inicial em `payments`
8. Retorna `{ order_id, checkout_url }`

### Decisões importantes

**Sem `payer.email`:** Enviar o e-mail real do usuário com credenciais de teste do MP gera o erro _"Uma das partes é de teste"_. O campo `payer` é omitido na preferência.

**Sem `auto_return`:** O campo `auto_return: "approved"` exige que `back_urls.success` seja uma URL HTTPS pública. Em localhost isso causa erro de validação. Para produção, pode ser reativado.

**`init_point` em vez de `sandbox_init_point`:** A URL `sandbox_init_point` causa `ERR_TOO_MANY_REDIRECTS` quando há conflito de sessão no browser (conta real vs. conta de teste). O `init_point` (checkout de produção do MP) funciona com credenciais de teste e não tem esse problema.

---

## Edge Function: `mercado-pago-webhook`

### Configuração de Deploy
```bash
# verify_jwt=false — webhooks do MP não enviam JWT
supabase functions deploy mercado-pago-webhook --no-verify-jwt
```

### Fluxo
1. Recebe notificação do MP (`topic=payment`)
2. Valida assinatura HMAC com `MERCADO_PAGO_WEBHOOK_SECRET`
3. Consulta o pagamento na API do MP
4. Atualiza `payments` com status, valor, método de pagamento
5. Atualiza `orders.status` (ex: `approved` → `pago`)

---

## Frontend: `checkoutService.ts`

### Por que `fetch` direto em vez de `supabase.functions.invoke()`?
O `supabase.functions.invoke()` envia o anon key no header Authorization, não o token da sessão do usuário. Usando `fetch` diretamente, passamos `session.access_token` explicitamente.

```typescript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(`${ENV.VITE_SUPABASE_URL}/functions/v1/checkout`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': ENV.VITE_SUPABASE_ANON_KEY,
  },
  body: JSON.stringify(payload),
});
```

---

## Como Testar (Sandbox)

1. Certifique-se de usar as **credenciais de teste** do MP (`MERCADO_PAGO_ACCESS_TOKEN`)
2. No **[Painel de Desenvolvedores do MP](https://www.mercadopago.com.br/developers/panel/app)**:
   - Acesse sua aplicação → **Contas de teste** → **Comprador**
   - Anote o **usuário** e **senha** da conta de teste
3. Adicione produtos ao carrinho, selecione frete, clique em **Finalizar Compra**
4. No checkout do MP, faça login com a **conta de teste comprador**
5. Use um cartão de teste (ex: `5031 4332 1540 6351`, CVV `123`, Venc `11/25`)
6. Verifique no banco que `orders`, `order_items` e `payments` foram atualizados

---

## Como Ir para Produção

1. Substituir `MERCADO_PAGO_ACCESS_TOKEN` pela credencial de **produção**
2. Reativar `auto_return: "approved"` na preferência (a URL de produção é HTTPS)
3. Configurar o webhook no painel do MP apontando para a edge function
4. Verificar RLS das tabelas `orders`, `order_items`, `payments`

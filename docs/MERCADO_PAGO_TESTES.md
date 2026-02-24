# Mercado Pago – Testes e conformidade com a documentação oficial

## Alterações feitas para alinhar à documentação

1. **URL de checkout em modo teste**  
   Com **credenciais de teste**, a API devolve `sandbox_init_point` (e não apenas `init_point`). O redirect passou a usar `sandbox_init_point` quando existir, caso contrário `init_point`. Assim os testes concluem no ambiente correto.

2. **Itens da preferência**  
   - `category_id`: passamos `others` para produtos e `services` para frete (valores aceites pela API).  
   - `title`/`description`: limitados a 256 caracteres.  
   - `quantity`: inteiro ≥ 1.  
   - `unit_price`: enviado como número.

3. **Webhook**  
   - Notificações são **POST** com query params `data.id` e `type` e body JSON (conforme documentação).  
   - A assinatura `x-signature` é validada com o manifest `id:{data.id};request-id:{x-request-id};ts:{ts};` e HMAC SHA256 em hexadecimal.

---

## Checklist para conseguir finalizar os testes

- [ ] **Credenciais de teste**  
  No Supabase (Edge Functions → Secrets), usar o **Access Token de teste** da aplicação em [Suas integrações](https://www.mercadopago.com.br/developers/panel/app) (Credenciais de teste), e não o de produção.

- [ ] **URL de checkout**  
  A Edge Function `mercado-pago-create-preference` já devolve `sandbox_init_point` em modo teste. Garantir que o front usa o `checkout_url` devolvido pela função (sem hardcode de URL).

- [ ] **E-mail do comprador**  
  No teste, usar um **e-mail diferente** do e-mail da conta Mercado Pago que criou a aplicação. Evitar usar “usuário de teste” no campo de e-mail do checkout.

- [ ] **Cartões de teste**  
  Usar os [cartões de teste](https://www.mercadopago.com.br/developers/pt/guides/additional-content/your-integrations/test-cards) oficiais. O nome do titular pode definir o resultado (ex.: aprovação, recusa). Não usar cartão real.

- [ ] **Back URLs**  
  As rotas `/pagamento/sucesso`, `/pagamento/falha` e `/pagamento/pendente` devem existir e estar acessíveis. Em localhost, o `origin` ou `siteUrl` deve bater com a URL do front (ex.: `http://localhost:5173`).

- [ ] **notification_url**  
  Deve ser HTTPS e acessível pela internet (ex.: Supabase Edge Function). Em testes, o webhook pode falhar se a URL não for alcançável; o pagamento no MP ainda pode ser concluído.

- [ ] **Tabela `payments`**  
  O webhook faz upsert em `payments`. A tabela deve existir com **UNIQUE em `external_id`**. Exemplo de criação (Supabase SQL Editor):

```sql
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  order_id text not null default '',
  status text not null,
  amount numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## Referências

- [Checkout Pro – Criar preferência](https://www.mercadopago.com.br/developers/en/docs/checkout-pro/create-payment-preference)  
- [Checkout Pro – Notificações de pagamento](https://www.mercadopago.com.br/developers/en/docs/checkout-pro/payment-notifications)  
- [Credenciais e testes](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/credentials)  
- [Cartões de teste](https://www.mercadopago.com.br/developers/pt/guides/additional-content/your-integrations/test-cards)

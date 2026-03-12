# Aquimaq - Soluções Agropecuárias Online

E-commerce especializado em produtos agropecuários, ferramentas, peças e sementes.

## Tecnologias

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, React Query, React Router
- **Backend/BaaS**: Supabase (Postgres, Auth, Storage, Realtime)
- **Pagamentos**: combinados após confirmação do pedido (ex.: contato)

## Setup Local

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente criando um arquivo `.env`:
   ```env
   # Obrigatórias
   VITE_SUPABASE_URL=https://<projeto>.supabase.co
   VITE_SUPABASE_ANON_KEY=<chave_anonima>

   # Opcionais
   VITE_OG_IMAGE=https://...            # imagem padrão para Open Graph (SEO)
   ```

3. Rode o projeto:
   ```bash
   npm run dev
   ```

4. **Supabase – Backend**: O schema do banco já deve estar aplicado no projeto Supabase remoto. Para replicar em um projeto novo, use o CLI:
   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
   As políticas RLS (Row Level Security) devem ser aplicadas pelas migrations disponíveis em `supabase/migrations/`. Se aplicou o projeto manualmente, execute as migrations no Dashboard (SQL Editor) ou via `db push`.

5. **Storage**: Crie no Dashboard (Storage > New bucket) os buckets **públicos**: `store-assets`, `product-images`.

6. **Estoque**: O botão **Restaurar estoque** no Admin > Dashboard executa a RPC `restore_stock_from_unpaid_orders()` para repor estoque de pedidos não pagos.

7. **Chatwoot + n8n (carrinhos abandonados / follow-up WhatsApp):** Secrets no Supabase, migration `cart_sessions`, deploy das Edge Functions `whatsapp-send` e `detect-abandoned-carts`, e configuração dos workflows n8n — ver [docs/configuration-chatwoot-n8n.md](docs/configuration-chatwoot-n8n.md).

## Estrutura do Projeto

- `/src/pages`: Páginas da aplicação (Loja e Admin)
- `/src/components`: Componentes reutilizáveis
- `/src/services`: Integrações com Supabase
- `/src/types`: Tipos TypeScript do banco e do domínio
- `/src/utils`: Utilitários (ex.: adapter de produtos)

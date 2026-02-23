# Aquimap - Soluções Agropecuárias Online

E-commerce especializado em produtos agropecuários, ferramentas, peças e sementes.

## Tecnologias

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, React Query, React Router
- **Backend/BaaS**: Supabase (Postgres, Auth, Storage, Realtime)
- **Pagamentos**: combinados após confirmação do pedido (ex.: contato/WhatsApp)

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
   VITE_WHATSAPP_NUMBER=5500000000000   # número padrão para CTAs de WhatsApp
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
   As políticas RLS (Row Level Security) estão em `supabase/migrations/20250223100000_crud_rls_policies.sql`. Sem elas, o CRUD falha (leitura/escrita negada). Se aplicou o projeto manualmente, execute esse SQL no Dashboard (SQL Editor) ou via `db push`.

5. **Storage**: Crie no Dashboard (Storage > New bucket) os buckets **públicos**: `store-assets`, `product-images`, `knowledge-base`.

6. **Estoque**: O botão **Restaurar estoque** no Admin > Dashboard executa a RPC `restore_stock_from_unpaid_orders()` para repor estoque de pedidos não pagos.

## Estrutura do Projeto

- `/src/pages`: Páginas da aplicação (Loja e Admin)
- `/src/components`: Componentes reutilizáveis
- `/src/services`: Integrações com Supabase
- `/src/types`: Tipos TypeScript do banco e do domínio
- `/src/utils`: Utilitários (ex.: adapter de produtos)

-- Permite que utilizadores autenticados (admin) leiam e gerem documentos de produtos.
-- Sem estas políticas, o REST API devolve 403 em product_documents.

alter table public.product_documents enable row level security;

drop policy if exists "Allow authenticated read product_documents" on public.product_documents;
create policy "Allow authenticated read product_documents"
  on public.product_documents for select
  to authenticated
  using (true);

drop policy if exists "Allow authenticated insert product_documents" on public.product_documents;
create policy "Allow authenticated insert product_documents"
  on public.product_documents for insert
  to authenticated
  with check (true);

drop policy if exists "Allow authenticated update product_documents" on public.product_documents;
create policy "Allow authenticated update product_documents"
  on public.product_documents for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Allow authenticated delete product_documents" on public.product_documents;
create policy "Allow authenticated delete product_documents"
  on public.product_documents for delete
  to authenticated
  using (true);

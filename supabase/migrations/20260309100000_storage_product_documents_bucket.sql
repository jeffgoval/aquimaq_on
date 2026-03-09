-- Bucket para PDFs de documentos de produto (bulas, manuais).
-- Sem isto, o upload em product-documents falha (bucket não existe ou sem políticas).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-documents',
  'product-documents',
  true,
  20971520,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Políticas: utilizadores autenticados podem fazer upload, ler e apagar.
drop policy if exists "Allow authenticated upload to product-documents" on storage.objects;
create policy "Allow authenticated upload to product-documents"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-documents');

drop policy if exists "Allow public read product-documents" on storage.objects;
create policy "Allow public read product-documents"
on storage.objects for select to public
using (bucket_id = 'product-documents');

drop policy if exists "Allow authenticated delete from product-documents" on storage.objects;
create policy "Allow authenticated delete from product-documents"
on storage.objects for delete to authenticated
using (bucket_id = 'product-documents');

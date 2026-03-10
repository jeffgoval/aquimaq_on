import { supabase } from './supabase';
import { ENV } from '@/config/env';

export interface ProductDocument {
  id: string;
  product_id: string;
  title: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string;
  processed: boolean;
  created_at: string;
}

export async function getProductDocuments(productId: string): Promise<ProductDocument[]> {
  const { data, error } = await supabase
    .from('product_documents')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function uploadProductDocument(
  productId: string,
  file: File,
  title: string
): Promise<ProductDocument> {
  const ext = file.name.split('.').pop() ?? 'pdf';
  const path = `${productId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  // 1. Upload para Storage (bucket e políticas: ver migração storage_product_documents_bucket)
  const { error: uploadError } = await supabase.storage
    .from('product-documents')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    const msg =
      uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')
        ? 'Bucket "product-documents" não existe. Execute a migração do Storage (supabase/migrations/*storage_product_documents_bucket*).'
        : uploadError.message?.includes('row-level security') || uploadError.message?.includes('policy')
          ? 'Sem permissão para enviar ficheiros. Faça login como admin e confirme as políticas do bucket.'
          : uploadError.message ?? 'Falha no upload do ficheiro.';
    throw new Error(msg);
  }

  // 2. Gerar URL pública
  const { data: urlData } = supabase.storage
    .from('product-documents')
    .getPublicUrl(path);

  const file_url = urlData.publicUrl;

  // 3. Registrar na tabela
  const { data, error } = await supabase
    .from('product_documents')
    .insert({
      product_id: productId,
      title,
      file_name: file.name,
      file_url,
      file_size: file.size,
      file_type: file.type || `application/${ext}`,
      processed: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function processProductDocument(documentId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Você precisa estar logado para processar documentos.');
  }

  const res = await fetch(
    `${ENV.VITE_SUPABASE_URL}/functions/v1/process-product-document`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: ENV.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ document_id: documentId }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Falha ao processar documento');
  }
}

export async function deleteProductDocument(documentId: string, fileUrl: string): Promise<void> {
  // Extrair path do Storage a partir da URL pública
  const parts = fileUrl.split('/product-documents/');
  if (parts.length >= 2) {
    await supabase.storage.from('product-documents').remove([parts[1]]);
  }

  // Deleta da tabela (cascata remove chunks do ai_knowledge_base)
  const { error } = await supabase
    .from('product_documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
}

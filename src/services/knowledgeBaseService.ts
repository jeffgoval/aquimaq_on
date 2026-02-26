import { supabase } from '@/services/supabase';
import type { AIKnowledgeBaseRow } from '@/types/database';

export interface KBEntry {
  id: string;
  sourceType: string;
  sourceId: string | null;
  title: string | null;
  content: string;
  chunkIndex: number | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: AIKnowledgeBaseRow): KBEntry {
  return {
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    title: row.title,
    content: row.content,
    chunkIndex: row.chunk_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Faz upload de um ficheiro para o bucket e regista na base de conhecimento. */
export const uploadDocument = async (
  file: File,
  metadata: { title?: string; source_type?: string; extractedText?: string } = {}
): Promise<void> => {
  const BUCKET = 'knowledge-base';
  const sanitizedName = file.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `public/${Date.now()}-${sanitizedName}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { error: insertError, data: insertedData } = await (supabase.from('ai_knowledge_base') as any).insert({
    source_type: metadata.source_type ?? 'manual',
    title: metadata.title ?? file.name,
    content: metadata.extractedText ? metadata.extractedText : `[Ficheiro: ${file.name}] URL: ${urlData.publicUrl}`,
    chunk_index: 0,
  }).select('id').single();
  
  if (insertError) throw new Error(insertError.message);

  if (insertedData) {
    // Invoke Edge Function for RAG vectorization asynchronously
    supabase.functions.invoke('rag-indexer', {
      body: { docId: insertedData.id },
    }).catch(console.error);
  }
};

/** Lista entradas da base de conhecimento. */
export const listDocuments = async (): Promise<KBEntry[]> => {
  const { data, error } = await supabase
    .from('ai_knowledge_base')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as AIKnowledgeBaseRow));
};

/** Remove uma entrada. */
export const deleteDocument = async (id: string): Promise<void> => {
  const { error } = await supabase.from('ai_knowledge_base').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

/** Reindexa um produto. */
export const reindexProduct = async (productId: string): Promise<void> => {
  const { data: product, error: productError } = await (supabase
    .from('products')
    .select('id, name, description, technical_specs')
    .eq('id', productId)
    .single() as any);

  if (productError || !product) throw new Error('Produto não encontrado');

  const p = product as { name: string; description: string | null; technical_specs: string | null };
  const content = [p.name, p.description, p.technical_specs].filter(Boolean).join('\n\n');

  if (!content.trim()) return;

  await supabase.from('ai_knowledge_base').delete().eq('source_type', 'product').eq('source_id', productId);

  await (supabase.from('ai_knowledge_base') as any).insert({
    source_type: 'product',
    source_id: productId,
    title: product.name,
    content,
    chunk_index: 0,
  });
};

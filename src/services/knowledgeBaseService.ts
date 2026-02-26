import { supabase } from '@/services/supabase';
import type { AIKnowledgeBaseRow } from '@/types/database';
// Vite resolve este import em build time e serve o worker da versão exata instalada
import pdfjsWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url';

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

/** Extrai texto de um PDF no browser usando pdfjs-dist (lazy-loaded). */
async function extractPdfText(file: File): Promise<string> {
  // Dynamic import: pdfjs-dist é carregado só quando necessário (admin KB section)
  const pdfjsLib = await import('pdfjs-dist');
  // Worker via CDN para não complicar o build do Vite
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .filter((item) => 'str' in item)
      .map((item) => (item as any).str as string)
      .join(' ');
    if (pageText.trim()) {
      fullText += `[Página ${i}]\n${pageText}\n\n`;
    }
  }

  return fullText.trim();
}

/** Faz upload de um ficheiro para o bucket e regista na base de conhecimento. */
export const uploadDocument = async (
  file: File,
  metadata: { title?: string; source_type?: string } = {}
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

  // PDFs: extrai texto no browser (evita incompatibilidade de libs PDF no runtime Deno)
  // Outros arquivos: guarda referência de URL
  let content: string;
  if (file.type === 'application/pdf') {
    const extractedText = await extractPdfText(file);
    content = extractedText || `[PDF sem texto extraível: ${file.name}]`;
  } else {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    content = `[Ficheiro: ${file.name}] URL: ${urlData.publicUrl}`;
  }

  const { data: inserted, error: insertError } = await (supabase.from('ai_knowledge_base') as any).insert({
    source_type: metadata.source_type ?? 'manual',
    title: metadata.title ?? file.name,
    content,
    chunk_index: 0,
  }).select('id').single();

  if (insertError || !inserted) {
    throw new Error('Falha ao registrar documento no banco: ' + insertError?.message);
  }

  // Chama o indexador para chunking + embedding (não precisa mais fazer parse de PDF)
  supabase.functions.invoke('rag-indexer', {
    body: { docId: inserted.id }
  }).catch(err => {
    console.error('Erro ao chamar a indexação RAG:', err);
  });
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

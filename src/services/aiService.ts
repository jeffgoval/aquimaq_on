/**
 * Serviço de ingestão e gestão da base de conhecimento (RAG).
 * Upload de PDFs para o bucket knowledge-base, processamento via Edge Function
 * e listagem/remoção de documentos.
 */

import { supabase } from '@/services/supabase';
import { ENV } from '@/config/env';

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

const KNOWLEDGE_BASE_BUCKET = 'knowledge-base';
const PROCESS_KNOWLEDGE_BASE_FUNCTION = 'process-knowledge-base';

/** Metadados armazenados em cada chunk (ex.: file_url, chunk_index). */
export interface KnowledgeBaseChunkMetadata {
  file_url?: string;
  storage_path?: string;
  chunk_index?: number;
  total_chunks?: number;
  ingested_at?: string;
  [key: string]: unknown;
}

/** Linha da tabela ai_knowledge_base (sem embedding no retorno por tamanho). */
export interface KnowledgeBaseRow {
  id: string;
  title: string;
  content: string;
  source_type: string;
  metadata: KnowledgeBaseChunkMetadata | null;
  created_at: string;
}

/** Resumo de um "documento" lógico (agrupamento de chunks por título/origem). */
export interface KnowledgeBaseDocumentSummary {
  id: string;
  title: string;
  sourceType: string;
  chunkCount: number;
  createdAt: string;
  /** URL do ficheiro no storage (se presente em metadata), para delete. */
  fileUrl?: string;
  storagePath?: string;
}

export interface UploadDocumentResult {
  url: string;
  path: string;
}

export interface ProcessDocumentParams {
  /** URL pública do PDF (usado se file_path não for enviado). */
  fileUrl: string;
  /** Path no bucket knowledge-base; quando enviado, a Edge Function baixa o ficheiro do storage. */
  filePath?: string;
  title?: string;
  sourceType?: string;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Extrai o path do bucket a partir da URL pública do storage. */
function getStoragePathFromPublicUrl(publicUrl: string): string {
  try {
    const url = new URL(publicUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (!pathMatch?.[1]) {
      throw new Error('URL do ficheiro inválida: não foi possível obter o path.');
    }
    return decodeURIComponent(pathMatch[1]);
  } catch {
    throw new Error('URL do ficheiro inválida.');
  }
}

// -----------------------------------------------------------------------------
// API Pública
// -----------------------------------------------------------------------------

/**
 * Faz o upload de um PDF para o bucket 'knowledge-base' do Supabase.
 * @param file - Ficheiro PDF
 * @returns URL pública e path no bucket
 */
export async function uploadDocument(file: File): Promise<UploadDocumentResult> {
  const allowedTypes = ['application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Apenas ficheiros PDF são permitidos.');
  }

  const maxSizeMB = 20;
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`Tamanho máximo: ${maxSizeMB}MB.`);
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
  const path = `documents/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(KNOWLEDGE_BASE_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) {
    throw new Error(error.message || 'Falha ao fazer upload do documento.');
  }

  const { data } = supabase.storage.from(KNOWLEDGE_BASE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * Chama a Edge Function process-knowledge-base para parse do PDF e geração de embeddings.
 * Envia file_path quando disponível (a função baixa do storage); caso contrário usa file_url.
 */
export async function processDocument(params: ProcessDocumentParams): Promise<void> {
  const { fileUrl, filePath, title, sourceType } = params;
  if (!fileUrl?.trim() && !filePath?.trim()) {
    throw new Error('fileUrl ou filePath é obrigatório.');
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error('É necessário estar autenticado para processar documentos.');
  }

  const body: Record<string, unknown> = {
    title: title ?? null,
    source_type: sourceType ?? 'document',
  };
  if (filePath?.trim()) body.file_path = filePath.trim();
  if (fileUrl?.trim()) body.file_url = fileUrl.trim();

  const response = await fetch(
    `${ENV.VITE_SUPABASE_URL}/functions/v1/${PROCESS_KNOWLEDGE_BASE_FUNCTION}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: ENV.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data?.message === 'string'
        ? data.message
        : typeof data?.error === 'string'
          ? data.error
          : `Erro ao processar documento (${response.status}).`;
    throw new Error(message);
  }
}

/**
 * Lista os documentos já processados na tabela ai_knowledge_base.
 * Agrupa chunks por título e source_type e devolve um resumo por documento.
 */
export async function getKnowledgeBase(): Promise<KnowledgeBaseDocumentSummary[]> {
  const { data, error } = await supabase
    .from('ai_knowledge_base')
    .select('id, title, source_type, metadata, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Falha ao listar a base de conhecimento.');
  }

  const rows = (data ?? []) as Pick<
    KnowledgeBaseRow,
    'id' | 'title' | 'source_type' | 'metadata' | 'created_at'
  >[];

  const byKey = new Map<string, KnowledgeBaseDocumentSummary>();
  for (const row of rows) {
    const key = `${row.title}|${row.source_type}`;
    const existing = byKey.get(key);
    const fileUrl =
      row.metadata && typeof row.metadata === 'object' && 'file_url' in row.metadata
        ? String((row.metadata as KnowledgeBaseChunkMetadata).file_url)
        : undefined;
    const storagePath =
      row.metadata && typeof row.metadata === 'object' && 'storage_path' in row.metadata
        ? String((row.metadata as KnowledgeBaseChunkMetadata).storage_path)
        : undefined;

    if (existing) {
      existing.chunkCount += 1;
      if (row.created_at < existing.createdAt) existing.createdAt = row.created_at;
    } else {
      byKey.set(key, {
        id: row.id,
        title: row.title,
        sourceType: row.source_type,
        chunkCount: 1,
        createdAt: row.created_at,
        fileUrl: fileUrl || undefined,
        storagePath: storagePath || undefined,
      });
    }
  }

  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Remove o documento do storage e os vetores associados na ai_knowledge_base.
 * @param fileUrlOrPath - URL pública do ficheiro (para apagar chunks por metadata.file_url) ou path no bucket (para apagar do storage e chunks por metadata.storage_path)
 */
export async function deleteDocument(fileUrlOrPath: string): Promise<void> {
  if (!fileUrlOrPath?.trim()) {
    throw new Error('URL ou path do documento é obrigatório.');
  }

  const isUrl = fileUrlOrPath.startsWith('http://') || fileUrlOrPath.startsWith('https://');
  let storagePath: string;
  let filterByUrl: boolean;

  if (isUrl) {
    storagePath = getStoragePathFromPublicUrl(fileUrlOrPath);
    filterByUrl = true;
  } else {
    storagePath = fileUrlOrPath;
    filterByUrl = false;
  }

  const { error: storageError } = await supabase.storage
    .from(KNOWLEDGE_BASE_BUCKET)
    .remove([storagePath]);

  if (storageError) {
    throw new Error(storageError.message || 'Falha ao remover ficheiro do storage.');
  }

  const filterKey = filterByUrl ? 'metadata->>file_url' : 'metadata->>storage_path';
  const filterValue = filterByUrl ? fileUrlOrPath : storagePath;

  const query = supabase.from('ai_knowledge_base') as ReturnType<typeof supabase.from> & {
    select: (cols: string) => { filter: (col: string, op: string, value: string) => ReturnType<ReturnType<typeof supabase.from>['select']> };
  };
  const { data: chunks, error: selectError } = await query.select('id').filter(filterKey, 'eq', filterValue);

  if (selectError) {
    throw new Error(selectError.message || 'Falha ao localizar vetores do documento.');
  }

  const ids = (chunks ?? []).map((c: { id: string }) => c.id);
  if (ids.length > 0) {
    const { error: deleteError } = await supabase.from('ai_knowledge_base').delete().in('id', ids);
    if (deleteError) {
      throw new Error(deleteError.message || 'Falha ao remover vetores do documento.');
    }
  }
}

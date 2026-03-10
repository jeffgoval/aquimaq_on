/**
 * Serviço RAG: consulta à base de conhecimento (bulas/manuais) para o agente IA.
 * Usa a função match_knowledge no Supabase (pgvector).
 */

import { supabase } from './supabase';

export interface MatchKnowledgeResult {
  id: string;
  product_document_id: string;
  product_id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface MatchKnowledgeOptions {
  matchCount?: number;
  productId?: string | null;
}

/**
 * Busca chunks mais similares ao vetor da pergunta (para usar como contexto no LLM).
 * O embedding da pergunta deve ser gerado com o mesmo modelo da ingestão (text-embedding-3-small).
 *
 * @param queryEmbedding - Vetor de 1536 dimensões (OpenAI text-embedding-3-small)
 * @param options - matchCount (default 5), productId (filtrar por produto)
 */
export async function matchKnowledge(
  queryEmbedding: number[],
  options: MatchKnowledgeOptions = {}
): Promise<MatchKnowledgeResult[]> {
  const { matchCount = 5, productId = null } = options;

  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: queryEmbedding as unknown as string,
    match_count: matchCount,
    filter_product_id: productId,
  });

  if (error) throw error;
  return (data ?? []) as MatchKnowledgeResult[];
}

/**
 * Concatena o conteúdo dos chunks para usar como contexto numa prompt.
 */
export function formatChunksAsContext(chunks: MatchKnowledgeResult[], separator = '\n\n---\n\n'): string {
  return chunks.map((c) => c.content.trim()).filter(Boolean).join(separator);
}

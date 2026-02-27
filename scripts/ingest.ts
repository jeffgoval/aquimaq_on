/**
 * Pipeline de ingestão para ai_knowledge_base (RAG).
 *
 * Dica de implementação: Popule a tabela com chunks de no máximo ~1000 caracteres
 * para garantir que a IA consiga processar a informação sem se perder.
 * Este script já divide o texto nesse tamanho (com 20% de overlap).
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

dotenv.config();

/** Chunks de no máximo este tamanho (recomendado para o RAG processar sem se perder). */
const CHUNK_MAX_CHARS = 1000;
const CHUNK_OVERLAP_CHARS = 200;

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

/**
 * Limpa ruidos de Markdown e HTML para melhorar a qualidade do embedding.
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/!\[.*\]\(.*\)/g, '') // Remove Markdown images
    .replace(/\[.*\]\(.*\)/g, '') // Remove Markdown links
    .replace(/#+/g, '') // Remove headers notation
    .replace(/\n{3,}/g, '\n\n') // Normalize empty lines
    .trim();
}

/**
 * Recursive Character Text Splitting.
 * Divide o texto em chunks de no máximo CHUNK_MAX_CHARS (1000) com overlap,
 * para a IA processar a informação sem se perder.
 */
function splitText(
  text: string,
  chunkSize = CHUNK_MAX_CHARS,
  overlapSize = CHUNK_OVERLAP_CHARS
): string[] {
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    
    // Se não for o fim do texto, tenta encontrar um ponto final ou quebra de linha para não cortar frase
    if (endIndex < text.length) {
      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastNewline = text.lastIndexOf('\n', endIndex);
      const bestCut = Math.max(lastPeriod, lastNewline);
      
      if (bestCut > startIndex + (chunkSize * 0.5)) {
        endIndex = bestCut + 1;
      }
    }

    chunks.push(text.substring(startIndex, endIndex).trim());
    startIndex = endIndex - overlapSize;
    
    // Evita loop infinito
    if (startIndex < 0) startIndex = 0;
    if (endIndex >= text.length) break;
  }

  return chunks;
}

/**
 * Executa o fluxo de ingestão de um documento.
 */
async function ingestDocument(title: string, rawContent: string, sourceType: string, metadata: any = {}) {
  console.log(`\n--- Iniciando ingestão: ${title} ---`);
  
  const cleanedContent = cleanText(rawContent);
  const chunks = splitText(cleanedContent);
  
  console.log(`Texto dividido em ${chunks.length} chunks.`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Processando chunk ${i + 1}/${chunks.length}...`);

    // 1. Gerar Embedding (text-embedding-3-small)
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunk,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // 2. Salvar no Supabase
    const { error } = await supabase.from('ai_knowledge_base').insert({
      title,
      content: chunk,
      source_type: sourceType,
      embedding,
      metadata: {
        ...metadata,
        chunk_index: i,
        total_chunks: chunks.length,
        ingested_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error(`Erro ao inserir chunk ${i}:`, error.message);
    }
  }

  console.log(`Sucesso: ${title} processado e enviado.`);
}

// CLI: npm run ingest -- <caminho-arquivo> [titulo] [sourceType]
async function main() {
  const args = process.argv.slice(2);
  const filePath = args[0];
  if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
    console.error('Defina VITE_SUPABASE_URL (ou SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY e OPENAI_API_KEY no .env');
    process.exit(1);
  }
  if (!filePath) {
    console.log('Uso: npm run ingest -- <caminho-arquivo> [titulo] [sourceType]');
    console.log('Ex.: npm run ingest -- ./docs/faq.md "FAQ Aquimaq" faq');
    return;
  }
  const fs = await import('node:fs');
  const path = await import('node:path');
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error('Arquivo não encontrado:', fullPath);
    process.exit(1);
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  const title = args[1] ?? path.basename(filePath, path.extname(filePath));
  const sourceType = args[2] ?? 'document';
  await ingestDocument(title, content, sourceType);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});

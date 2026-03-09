# Fluxo de Ingestão RAG — Bulas e Manuais para Agente IA

## Como testar o sucesso (upload + processamento)

1. **Login no admin** e abre a edição de um produto que tenha a secção de documentos (bulas/manuais).
2. **Upload:** preenche o título, escolhe um PDF (até 20 MB) e clica em **Enviar**.
3. **Sucesso do upload:**
   - O documento aparece na lista (título, nome do ficheiro, tamanho).
   - Clicar em **Download** (ícone) abre o PDF no browser → confirma que o ficheiro está no Storage.
4. **Sucesso do processamento (RAG):**
   - O estado passa de **"Processando..."** (amarelo) para **"IA pronta"** (verde).
   - Se ficar **"Pendente"** ou der erro, verifica: Edge Function deployada, `OPENAI_API_KEY` nos secrets da função, e logs em Supabase → Edge Functions → process-product-document.
5. **Verificação opcional no Supabase:**
   - **Storage** → bucket `product-documents` → deve existir a pasta com o `product_id` e o ficheiro.
   - **Table Editor** → `product_documents` → a linha do documento com `processed = true`.
   - **Table Editor** → `ai_knowledge_base` → devem existir linhas com o mesmo `product_document_id` (chunks com embedding).

---

## Recomendação: Ingestão na App (Supabase Edge Function)

Para **PDFs de bulas e manuais de máquinas** associados a produtos, o fluxo já existente na app é o mais adequado:

| Critério | App (Edge Function) | n8n |
|----------|----------------------|-----|
| **Onde estão os PDFs** | Upload no admin por produto | Terias de enviar ficheiros/URLs para o n8n |
| **Contexto** | Cada documento já tem `product_id` e título | Precisarias de mapear produto manualmente |
| **Manutenção** | Um único código (Supabase + frontend) | Dois sistemas (n8n + app) |
| **Re-processar** | Botão "Processar para IA" no admin | Workflow separado |

**Quando usar n8n para RAG:** ingestão em massa a partir de URLs/pastas externas, ou quando quem faz upload não usa o admin (ex.: integração com outro sistema). Para o teu caso (admin já faz upload por produto), a Edge Function é a opção certa.

---

## Arquitetura do fluxo (recomendada)

```
Admin (ProductDocumentsManager)
  → Upload PDF → Storage (product-documents) + registo em product_documents (processed=false)
  → Clique "Processar" ou automático após upload
      → Chama Edge Function: process-product-document { document_id }
            → 1. Busca URL do PDF em product_documents + Storage
            → 2. Extrai texto do PDF (serviço externo ou lib no Deno)
            → 3. Chunking (ex.: 500–800 chars, overlap 100)
            → 4. Embeddings (OpenAI text-embedding-3-small ou ada-002)
            → 5. Insert em ai_knowledge_base (content, embedding, product_document_id, product_id, metadata)
            → 6. UPDATE product_documents SET processed = true WHERE id = document_id

Agente IA (em n8n ou na app)
  → Recebe pergunta do utilizador (opcional: product_id para filtrar)
  → Embedding da pergunta → busca vetorial em ai_knowledge_base (pgvector)
  → Top-k chunks → contexto para o LLM → resposta
```

---

## Storage: bucket `product-documents`

Para o **upload de PDFs** funcionar, o bucket e as políticas têm de existir. Migração: `supabase/migrations/20260309100000_storage_product_documents_bucket.sql`. Ela cria o bucket `product-documents` (público, máx. 20 MB, só `application/pdf`) e as políticas RLS em `storage.objects` (upload/leitura/apagar). Se o PDF não sobe, confirma que esta migração foi aplicada no teu projeto Supabase.

## Tabela `ai_knowledge_base`

A migração SQL está em `supabase/migrations/`. Resumo:

- **id** (uuid), **product_document_id** (FK), **product_id** (redundante para filtro rápido)
- **content** (texto do chunk)
- **embedding** (vector(1536) — OpenAI)
- **metadata** (jsonb: página, índice do chunk, etc.)
- **created_at**

Índice HNSW ou IVFFlat sobre `embedding` para busca por similaridade.

---

## Edge Function `process-product-document`

A função já é chamada pelo frontend com `{ document_id }`. Deve:

1. **Validar** — JWT e que o documento existe e pertence a um produto.
2. **Obter o PDF** — URL em `product_documents.file_url` ou download do Storage.
3. **Extrair texto** — Opções:
   - **Supabase + Deno:** usar uma lib que leia PDF (ex.: `pdfjs-dist` ou chamar API externa).
   - **Serviço externo:** por exemplo, um worker (Node/Python) que receba URL e devolva texto; a Edge Function chama esse worker.
4. **Chunking** — Dividir texto em blocos (ex.: 600 caracteres, 80 de overlap); guardar em array.
5. **Embeddings** — Chamar OpenAI Embeddings API (ou outro) para cada chunk; batch de 100 se possível.
6. **Inserir** — `INSERT INTO ai_knowledge_base (product_document_id, product_id, content, embedding, metadata)` por chunk.
7. **Marcar processado** — `UPDATE product_documents SET processed = true WHERE id = document_id`.

**Variáveis de ambiente** (Supabase Dashboard → Edge Functions → process-product-document → Secrets):

- `OPENAI_API_KEY` — obrigatório; usado para embeddings (modelo `text-embedding-3-small`).

Deploy da função (CLI): `supabase functions deploy process-product-document`. O código está em `supabase/functions/process-product-document/index.ts`. Se o deploy falhar por dependências npm (ex.: pdf-parse), faz deploy pelo Dashboard ou usa um serviço externo de PDF-to-text e chama-o a partir da função.

---

## Consulta pelo agente IA

Quando o agente precisar de responder com base nos manuais/bulas:

1. Opcional: filtrar por `product_id` se a pergunta for sobre um produto específico.
2. Gerar embedding da pergunta (mesmo modelo que na ingestão).
3. Chamar a função RPC (definida na migração):
   ```ts
   const { data: chunks } = await supabase.rpc('match_knowledge', {
     query_embedding: embeddingDaPergunta,
     match_count: 5,
     filter_product_id: productId ?? null,  // opcional
   });
   ```
4. Passar `chunks.map(c => c.content).join('\n')` como contexto ao LLM e gerar a resposta.

---

## Alternativa: ingestão via n8n

Se no futuro quiseres **também** ingerir a partir de n8n (ex.: URLs fixas, pastas partilhadas):

- **Trigger:** Webhook (POST com URL do PDF ou ficheiro) ou Schedule (lista de URLs).
- **Nós:** HTTP Request (download) → extração de texto (Code ou serviço externo) → chunking (Code) → OpenAI Embeddings → Supabase Insert em `ai_knowledge_base`.
- Nesse fluxo, terias de definir como obter `product_id` (ex.: parâmetro no webhook ou regra por nome de ficheiro).

O MCP n8n atual não expõe criação de workflows; o fluxo seria criado manualmente na UI do n8n.

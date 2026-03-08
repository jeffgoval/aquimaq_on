import { createClient } from "npm:@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// CORS — mesmo padrão das demais Edge Functions do projeto
// ---------------------------------------------------------------------------
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Resposta JSON padronizada com CORS. */
function jsonResponse(
  body: Record<string, unknown>,
  status = 200
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface ChatPayload {
  message: string;
  sessionId: string;
  isHumanTakeover: boolean;
}

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  brand: string | null;
  category: string | null;
}

interface DocumentChunk {
  id: string;
  product_id: string;
  content: string;
  similarity: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extrai palavras-chave da mensagem do usuário (>= 3 caracteres). */
function extractKeywords(text: string): string[] {
  const stopwords = new Set([
    "que", "para", "com", "uma", "uns", "tem", "ter", "ela", "ele",
    "dos", "das", "nos", "nas", "por", "mais", "como", "mas", "foi",
    "são", "ser", "seu", "sua", "não", "sim", "muito", "pode", "quero",
    "preciso", "sobre", "esse", "essa", "este", "esta", "isso", "isto",
    "qual", "quais", "onde", "quando", "tambem", "também", "ainda",
    "aqui", "ali", "voce", "você", "gostaria", "favor",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopwords.has(w));
}

/** Busca produtos no catálogo via ilike nas palavras-chave. */
async function searchProducts(
  supabaseUrl: string,
  serviceRoleKey: string,
  keywords: string[]
): Promise<CatalogProduct[]> {
  if (keywords.length === 0) return [];

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Monta filtros OR: name.ilike.%kw% , description.ilike.%kw% , brand.ilike.%kw%
  const filters = keywords
    .slice(0, 4) // limita a 4 termos para evitar queries muito pesadas
    .flatMap((kw) => [
      `name.ilike.%${kw}%`,
      `description.ilike.%${kw}%`,
      `brand.ilike.%${kw}%`,
    ])
    .join(",");

  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, stock, image_url, brand, category")
    .or(filters)
    .eq("is_active", true)
    .gt("stock", 0)
    .limit(5);

  if (error) {
    console.error("RAG search error:", error.message);
    return [];
  }

  return (data as CatalogProduct[]) ?? [];
}

/**
 * Gera um embedding numérico de 1536 dimensões via OpenAI
 */
async function generateEmbedding(
  apiKey: string,
  input: string
): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("OpenAI Embedding Error:", res.status, errorBody);
    throw new Error(`Falha na API da OpenAI (Embeddings): ${res.status}`);
  }

  const json = await res.json();
  return json.data[0].embedding;
}

/** Busca em manuais e bulas por similaridade vetorial. */
async function searchDocuments(
  supabaseUrl: string,
  serviceRoleKey: string,
  embedding: number[]
): Promise<DocumentChunk[]> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: embedding,
    match_threshold: 0.3, // Threshold de similaridade (30%)
    match_count: 3, // Top 3 trechos
  });

  if (error) {
    console.error("Vector search error:", error.message);
    return [];
  }

  return (data as DocumentChunk[]) ?? [];
}

/** Monta o system prompt do balconista. */
function buildSystemPrompt(
  products: CatalogProduct[],
  documents: DocumentChunk[]
): string {
  const catalogoSection =
    products.length > 0
      ? `\n\nPRODUTOS ENCONTRADOS NO CATÁLOGO (EM ESTOQUE):\n${products
        .map(
          (p) =>
            `- ID: ${p.id} | ${p.name} | R$ ${p.price.toFixed(2)} | Estoque: ${p.stock}${p.brand ? ` | Marca: ${p.brand}` : ""}${p.category ? ` | Categoria: ${p.category}` : ""}`
        )
        .join("\n")}`
      : "\n\nNenhum produto relevante encontrado no catálogo para esta consulta.";

  const manuaisSection =
    documents.length > 0
      ? `\n\nTRECHOS DE MANUAIS E BULAS ENCONTRADOS (BASE DE CONHECIMENTO):\n${documents
        .map((d, i) => `--- Trecho ${i + 1} (Produto ID: ${d.product_id}) ---\n${d.content}`)
        .join("\n\n")}`
      : "";

  return `Você é o Balconista Digital da Aquimaq, uma loja agropecuária.
Seu papel é atender produtores rurais de forma objetiva e amigável.

REGRAS:
1. Responda SEMPRE em português brasileiro, de forma curta e direta.
2. Se o cliente perguntar sobre um produto e houver itens no catálogo abaixo, recomende-os citando o nome, preço e disponibilidade.
3. Quando recomendar um produto específico, inclua OBRIGATORIAMENTE o marcador no formato: [PRODUCT:id:nome:preço]
   Exemplo: [PRODUCT:abc-123:Filtro de Óleo John Deere:89.90]
4. Nunca invente produtos. Use APENAS os produtos listados abaixo.
5. Se não encontrar produtos relevantes, sugira que o cliente entre em contato com a loja para consulta personalizada.
6. Para dúvidas técnicas, consulte primeiramente os TRECHOS DE MANUAIS E BULAS ENCONTRADOS abaixo. Use essas informações oficiais para responder.
7. Incentive a modalidade "Retirada na Loja" (BOPIS) — destaque que o cliente pode retirar o pedido na loja sem custo de frete.
8. Seja cordial, use linguagem do campo quando apropriado ("parceiro", "patrão"), mas mantenha profissionalismo.
${catalogoSection}
${manuaisSection}`;
}

/** Chama a API da OpenAI (chat/completions) via fetch nativo do Deno. */
async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("OpenAI API error:", res.status, err);
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "Desculpe, não consegui gerar uma resposta.";
}

/** Extrai marcadores [PRODUCT:id:name:price] da resposta da IA. */
function parseProductMarkers(
  reply: string
): Array<{ id: string; name: string; price: number }> {
  const regex = /\[PRODUCT:([^:]+):([^:]+):([^\]]+)\]/g;
  const results: Array<{ id: string; name: string; price: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(reply)) !== null) {
    results.push({
      id: match[1].trim(),
      name: match[2].trim(),
      price: parseFloat(match[3].trim()) || 0,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Somente POST
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // ---- Variáveis de ambiente ----
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  if (!openaiKey) {
    return jsonResponse(
      { error: "OpenAI API key is not configured" },
      500
    );
  }

  // ---- Parse body ----
  let payload: ChatPayload;
  try {
    const body = await req.json();
    if (
      typeof body.message !== "string" ||
      !body.message.trim() ||
      typeof body.sessionId !== "string"
    ) {
      return jsonResponse(
        { error: "Body must include 'message' (string) and 'sessionId' (string)" },
        400
      );
    }
    payload = {
      message: body.message.trim(),
      sessionId: body.sessionId,
      isHumanTakeover: body.isHumanTakeover === true,
    };
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  // ---- Transbordo humano ----
  if (payload.isHumanTakeover) {
    return jsonResponse({
      reply:
        "Você está sendo atendido por um de nossos especialistas. Aguarde um momento, por favor.",
      isHumanTakeover: true,
      products: [],
    });
  }

  // ---- RAG: busca de produtos ----
  const keywords = extractKeywords(payload.message);

  // Executa RAG do Catálogo e Embedding da pergunta em paralelo
  const [catalogProducts, questionEmbedding] = await Promise.all([
    searchProducts(supabaseUrl, serviceRoleKey, keywords),
    generateEmbedding(openaiKey, payload.message).catch(() => null),
  ]);

  // ---- RAG: busca vetorial profunda em PDFs ----
  let documentChunks: DocumentChunk[] = [];
  if (questionEmbedding) {
    documentChunks = await searchDocuments(
      supabaseUrl,
      serviceRoleKey,
      questionEmbedding
    );
  }

  // ---- OpenAI ----
  let aiReply: string;
  try {
    const systemPrompt = buildSystemPrompt(catalogProducts, documentChunks);
    aiReply = await callOpenAI(openaiKey, systemPrompt, payload.message);
  } catch (err) {
    console.error("OpenAI call failed:", err);
    return jsonResponse(
      {
        reply:
          "Desculpe parceiro, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes ou entre em contato com a loja.",
        products: [],
      },
      200
    );
  }

  // ---- Parse product markers from AI reply ----
  const recommendedProducts = parseProductMarkers(aiReply);

  // Enriquece com image_url dos produtos do catálogo
  const enrichedProducts = recommendedProducts.map((rp) => {
    const catalogItem = catalogProducts.find((cp) => cp.id === rp.id);
    return {
      ...rp,
      image_url: catalogItem?.image_url ?? null,
    };
  });

  // Remove os marcadores da resposta final para exibição limpa
  const cleanReply = aiReply
    .replace(/\[PRODUCT:[^\]]+\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return jsonResponse({
    reply: cleanReply,
    products: enrichedProducts,
    sessionId: payload.sessionId,
  });
});

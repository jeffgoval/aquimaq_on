import { createClient } from "npm:@supabase/supabase-js@2";
import pdf from "npm:pdf-parse@1.1.1";
import { Buffer } from "node:buffer";

const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
// Helpers para Chunking e Embeddings
// ---------------------------------------------------------------------------

/**
 * Quebra o texto completo em pedaços (chunks).
 * Utiliza sobreposição (overlap) para não cortar frases no meio.
 */
function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    // Remove quebras de linha múltiplas para limpar o layout do PDF
    const cleanText = text.replace(/\n+/g, " ").trim();

    while (startIndex < cleanText.length) {
        const endIndex = startIndex + chunkSize;
        const chunk = cleanText.slice(startIndex, endIndex);
        chunks.push(chunk);
        startIndex += chunkSize - overlap;
    }
    return chunks;
}

/**
 * Extrai texto completo de um buffer PDF
 */
async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
    const data = await pdf(Buffer.from(pdfBuffer));
    return data.text;
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

// ---------------------------------------------------------------------------
// Handler Principal
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: corsHeaders,
            status: 200 // Ensure 200 HTTP status code for preflights
        });
    }

    if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !serviceRoleKey || !openaiKey) {
        return jsonResponse({ error: "Server configuration error" }, 500);
    }

    // Verifica Autenticação via JWT (apenas admin/vendedor deve usar)
    const authHeader = req.headers.get("Authorization") ?? "";
    const authClient = createClient(supabaseUrl, serviceRoleKey, {
        global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
        console.error("Auth error:", authError);
        return jsonResponse({ error: "Unauthorized access" }, 401);
    }

    let body;
    try {
        body = await req.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    if (!body.product_id || !body.pdf_url) {
        return jsonResponse({ error: "Missing product_id or pdf_url" }, 400);
    }

    try {
        // 1. Fazer o download do PDF
        console.log(`Downloading PDF from: ${body.pdf_url}`);
        const pdfRes = await fetch(body.pdf_url);
        if (!pdfRes.ok) throw new Error("Could not download the document");
        const pdfArrayBuffer = await pdfRes.arrayBuffer();

        // 2. Extrair o texto
        console.log("Extracting text...");
        const extractedText = await extractTextFromPdf(pdfArrayBuffer);
        if (!extractedText.trim()) throw new Error("No text found in PDF");

        // 3. Fatiar o texto
        console.log("Chunking text...");
        const chunks = chunkText(extractedText);
        console.log(`Generated ${chunks.length} chunks`);

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // 4. Limpa chunks antigos desse produto (se for reprocessamento)
        await supabaseAdmin
            .from("document_chunks")
            .delete()
            .eq("product_id", body.product_id);

        // 5. Gera embeddings e salva no banco (em lotes para não gargalar mem)
        let processedCount = 0;

        // Processamento sequencial simples (se muitos chunks, pode dar timeout 
        // nas edge functions, então consideramos que manuais são razoáveis 
        // ou dividimos via Queue futuramente)
        for (const chunk of chunks) {
            if (!chunk.trim()) continue;

            const embedding = await generateEmbedding(openaiKey, chunk);

            const { error: dbError } = await supabaseAdmin
                .from("document_chunks")
                .insert({
                    product_id: body.product_id,
                    content: chunk,
                    embedding
                });

            if (dbError) {
                console.error("Erro inserindo chunk no BD:", dbError);
                throw new Error("Failed to save chunk to database");
            }
            processedCount++;
        }

        return jsonResponse({
            message: `PDF Processado com sucesso. ${processedCount} trechos vetorizados.`,
            chunksCount: processedCount
        });

    } catch (err: any) {
        console.error("Erro geral process-pdf:", err);
        return jsonResponse({ error: err.message }, 500);
    }
});

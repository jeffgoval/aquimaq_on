import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import PDFParser from "https://esm.sh/pdf-parse@1.1.1?no-check";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const KNOWLEDGE_BASE_BUCKET = "knowledge-base";
const CHUNK_SIZE = 1000;
const OVERLAP = 200;
const MIN_CHUNK_LENGTH = 50;

/** Extrai o path do bucket a partir da URL pública do storage Supabase. */
function getStoragePathFromPublicUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const match = url.pathname.match(
      /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/
    );
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/** Monta a URL pública do storage a partir do path no bucket. */
function getPublicUrlFromPath(
  supabaseUrl: string,
  bucket: string,
  path: string
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${encodeURIComponent(path)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const file_path = body.file_path ?? body.filePath;
    const file_url = body.file_url ?? body.fileUrl;
    const document_title =
      body.document_title ?? body.title ?? "Documento";
    const source_type = body.source_type ?? body.sourceType ?? "pdf";

    if (!file_path?.trim() && !file_url?.trim()) {
      return new Response(
        JSON.stringify({ error: "file_path ou file_url é obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Buscar chave da OpenAI no banco
    const { data: settings } = await supabaseClient
      .from("ai_settings")
      .select("api_key")
      .single();

    if (!settings?.api_key) {
      throw new Error("API Key não configurada em ai_settings");
    }

    let pdfBuffer: ArrayBuffer;
    let storage_path: string | null = null;
    let resolved_file_url: string;

    // 2. Baixar o arquivo do Storage (ou via file_url)
    if (file_path?.trim()) {
      const { data: fileData, error: downloadError } = await supabaseClient
        .storage
        .from(KNOWLEDGE_BASE_BUCKET)
        .download(file_path.trim());

      if (downloadError) throw downloadError;
      if (!fileData) throw new Error("Arquivo não encontrado no storage");

      pdfBuffer = await fileData.arrayBuffer();
      storage_path = file_path.trim();
      resolved_file_url = getPublicUrlFromPath(
        supabaseUrl,
        KNOWLEDGE_BASE_BUCKET,
        storage_path
      );
    } else {
      const pdfRes = await fetch(file_url!, {
        headers: { Accept: "application/pdf" },
      });
      if (!pdfRes.ok) {
        throw new Error(
          `Falha ao obter o PDF: ${pdfRes.status} ${pdfRes.statusText}`
        );
      }
      pdfBuffer = await pdfRes.arrayBuffer();
      storage_path = getStoragePathFromPublicUrl(file_url!);
      resolved_file_url = file_url!;
    }

    // 3. Extrair texto do PDF (pdf-parse)
    const arrayBuffer = pdfBuffer;
    const pdfData = await PDFParser(new Uint8Array(arrayBuffer)) as { text: string };
    const fullText = pdfData?.text ?? "";

    if (!fullText?.trim()) {
      return new Response(
        JSON.stringify({ error: "O PDF não contém texto extraível" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Chunking: blocos de 1000 caracteres com 200 de sobreposição
    const chunks: string[] = [];
    for (let i = 0; i < fullText.length; i += CHUNK_SIZE - OVERLAP) {
      chunks.push(fullText.substring(i, i + CHUNK_SIZE));
    }

    console.log(
      `Processando ${chunks.length} blocos para o documento: ${document_title}`
    );

    const ingested_at = new Date().toISOString();

    // 5. Vetorização e inserção
    let inserted = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const trimmed = chunk.trim();
      if (trimmed.length < MIN_CHUNK_LENGTH) continue;

      // Gerar embedding para o bloco
      const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: trimmed.replace(/\n/g, " "),
        }),
      });

      const embeddingData = await embeddingRes.json();
      if (embeddingData.error) {
        throw new Error(`Erro OpenAI: ${embeddingData.error.message}`);
      }
      const embedding = embeddingData.data[0].embedding;

      const metadata: Record<string, unknown> = {
        file_url: resolved_file_url,
        chunk_index: i,
        total_chunks: chunks.length,
        ingested_at,
      };
      if (storage_path) metadata.storage_path = storage_path;

      const { error: insertError } = await supabaseClient
        .from("ai_knowledge_base")
        .insert({
          title: document_title,
          content: trimmed,
          source_type,
          embedding,
          metadata,
        });

      if (insertError) throw insertError;
      inserted++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        ok: true,
        chunks: inserted,
        message: `${inserted} blocos processados com sucesso.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

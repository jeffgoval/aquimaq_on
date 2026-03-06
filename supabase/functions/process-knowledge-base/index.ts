import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CHUNK_SIZE = 1000;
const OVERLAP = 200;
const MIN_CHUNK_LENGTH = 50;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const text: string = body.text ?? "";
    const document_title: string = body.document_title ?? body.title ?? "Documento";
    const file_path: string = body.file_path ?? "";
    const source_type: string = body.source_type ?? "pdf";

    if (!text.trim()) {
      return new Response(
        JSON.stringify({ error: "Texto do documento não pode estar vazio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Buscar chave da OpenAI
    const { data: settings } = await supabaseClient
      .from("ai_settings")
      .select("api_key")
      .single();

    if (!settings?.api_key) {
      throw new Error("API Key não configurada em ai_settings");
    }

    // 2. Chunking com sobreposição
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE - OVERLAP) {
      const chunk = text.substring(i, i + CHUNK_SIZE).trim();
      if (chunk.length >= MIN_CHUNK_LENGTH) chunks.push(chunk);
    }

    if (!chunks.length) {
      return new Response(
        JSON.stringify({ error: "Texto muito curto para indexar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-knowledge-base] ${chunks.length} chunks — "${document_title}"`);

    // 3. Gerar embeddings e inserir
    const ingested_at = new Date().toISOString();
    const metadata: Record<string, unknown> = { ingested_at };
    if (file_path) metadata.storage_path = file_path;

    let inserted = 0;
    for (let i = 0; i < chunks.length; i++) {
      const embRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: chunks[i].replace(/\n/g, " "),
        }),
      });

      const embData = await embRes.json();
      if (embData.error) throw new Error(`OpenAI: ${embData.error.message}`);

      const { error: insertError } = await supabaseClient
        .from("ai_knowledge_base")
        .insert({
          title: document_title,
          content: chunks[i],
          source_type,
          embedding: embData.data[0].embedding,
          metadata: { ...metadata, chunk_index: i, total_chunks: chunks.length },
        });

      if (insertError) throw insertError;
      inserted++;
    }

    return new Response(
      JSON.stringify({ ok: true, chunks: inserted, message: `${inserted} blocos indexados com sucesso.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// @ts-check
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Extração de PDF: usa pdf-parse. Se o deploy falhar, fazer deploy pelo Dashboard ou usar API externa.
// @ts-ignore
import pdfParse from "npm:pdf-parse";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 80;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned.length) return chunks;
  while (start < cleaned.length) {
    const end = Math.min(start + CHUNK_SIZE, cleaned.length);
    chunks.push(cleaned.slice(start, end));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: batch }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI embeddings: ${res.status} ${err}`);
    }
    const data = await res.json();
    const order = (data.data as { index: number; embedding: number[] }[]).sort(
      (a, b) => a.index - b.index
    );
    out.push(...order.map((x) => x.embedding));
  }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let documentId: string;
  try {
    const body = await req.json();
    documentId = body?.document_id;
    if (!documentId || typeof documentId !== "string") {
      return new Response(
        JSON.stringify({ error: "document_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: doc, error: docError } = await supabase
    .from("product_documents")
    .select("id, product_id, file_url")
    .eq("id", documentId)
    .single();

  if (docError || !doc) {
    return new Response(
      JSON.stringify({ error: "Document not found", detail: docError?.message }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const pdfRes = await fetch(doc.file_url);
  if (!pdfRes.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch PDF", status: pdfRes.status }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const buffer = await pdfRes.arrayBuffer();
  let fullText: string;
  try {
    const data = await pdfParse(new Uint8Array(buffer));
    fullText = (data?.text ?? "").trim();
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: "PDF text extraction failed",
        detail: e instanceof Error ? e.message : String(e),
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const chunks = chunkText(fullText);
  if (chunks.length === 0) {
    await supabase
      .from("product_documents")
      .update({ processed: true })
      .eq("id", documentId);
    return new Response(
      JSON.stringify({ ok: true, chunks: 0, message: "No text to embed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const embeddings = await getEmbeddings(chunks);

  const rows = chunks.map((content, i) => ({
    product_document_id: doc.id,
    product_id: doc.product_id,
    content,
    embedding: embeddings[i],
    metadata: { chunk_index: i, total: chunks.length },
  }));

  const { error: insertError } = await supabase
    .from("ai_knowledge_base")
    .insert(rows);

  if (insertError) {
    return new Response(
      JSON.stringify({ error: "Failed to save chunks", detail: insertError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  await supabase
    .from("product_documents")
    .update({ processed: true })
    .eq("id", documentId);

  return new Response(
    JSON.stringify({ ok: true, chunks: chunks.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

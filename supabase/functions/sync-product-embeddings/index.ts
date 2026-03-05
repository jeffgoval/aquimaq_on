import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "")?.trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || !["admin", "gerente"].includes(profile.role as string)) {
      return new Response(JSON.stringify({ error: "Apenas admin ou gerente pode sincronizar embeddings." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settings } = await supabase
      .from("ai_settings")
      .select("api_key")
      .single();
    if (!settings?.api_key) {
      return new Response(
        JSON.stringify({ error: "API Key não configurada em ai_settings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json().catch(() => ({}))) as { only_missing?: boolean };
    const onlyMissing = body.only_missing !== false;

    let query = supabase
      .from("products")
      .select("id, name, category")
      .eq("is_active", true);
    if (onlyMissing) {
      query = query.is("embedding", null);
    }
    const { data: products, error: fetchError } = await query.limit(500);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: "Erro ao buscar produtos", details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!products?.length) {
      return new Response(
        JSON.stringify({ ok: true, updated: 0, message: "Nenhum produto para processar." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let updated = 0;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      const texts = batch.map(
        (p: { name: string; category: string | null }) =>
          [p.name, p.category].filter(Boolean).join(" ").trim()
      );

      const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
      });
      const embeddingData = await embeddingRes.json();
      if (embeddingData.error) {
        return new Response(
          JSON.stringify({ error: "OpenAI embeddings", details: embeddingData.error }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const embeddings = embeddingData.data?.map((d: { embedding: number[] }) => d.embedding) ?? [];
      for (let j = 0; j < batch.length; j++) {
        const product = batch[j];
        const embedding = embeddings[j];
        if (!embedding) continue;
        const { error: updateError } = await supabase
          .from("products")
          .update({ embedding })
          .eq("id", product.id);
        if (!updateError) updated++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, updated, total: products.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

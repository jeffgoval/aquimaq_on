import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const conversation_id = body.conversation_id ?? body.conversationId;
    const message = body.message;

    if (!conversation_id || !message?.trim()) {
      throw new Error("conversation_id e message são obrigatórios");
    }

    // 1. Buscar Configurações de IA (API Key segura)
    const { data: settings } = await supabaseClient
      .from("ai_settings")
      .select("*")
      .single();

    if (!settings?.api_key) throw new Error("Configurações de IA não encontradas");

    // 2. Gerar Embedding para a pergunta do usuário
    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: message,
      }),
    });
    const embeddingData = await embeddingRes.json();
    const embedding = embeddingData.data[0].embedding;

    // 3. Busca Semântica no Banco de Dados (RAG)
    const { data: documents } = await supabaseClient.rpc("match_knowledge_base", {
      query_embedding: embedding,
      match_threshold: 0.4, // Calibragem profissional
      match_count: 5,
    });

    // 4. Buscar Histórico da Conversa para dar memória
    const { data: history } = await supabaseClient
      .from("chat_messages")
      .select("content, sender_type")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: false })
      .limit(6);

    // 5. Construir o Contexto e Prompt
    const contextText =
      documents?.map((d) => `[FONTE: ${d.title}]\n${d.content}`).join("\n\n") ??
      "Nenhum contexto encontrado.";

    const messages = [
      {
        role: "system",
        content: `Você é o assistente técnico da Aquimaq. Use o contexto abaixo para responder.
Se não souber, diga que não encontrou a informação e encaminhe para um humano.
CONTEXTO:\n${contextText}`,
      },
      ...([...(history ?? [])].reverse().map((m) => ({
        role: m.sender_type === "customer" ? "user" : "assistant",
        content: m.content,
      }))),
      { role: "user", content: message },
    ];

    // 6. Gerar Resposta Final
    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: settings.model || "gpt-4o-mini",
        messages,
        temperature: 0.2,
      }),
    });

    const chatData = await chatRes.json();
    const reply = chatData.choices[0].message.content;

    // 7. Salvar Mensagens no Banco
    await supabaseClient.from("chat_messages").insert([
      { conversation_id, content: message, sender_type: "customer" },
      { conversation_id, content: reply, sender_type: "ai_agent" },
    ]);

    await supabaseClient
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation_id);

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

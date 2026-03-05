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
    const body = await req.json() as Record<string, unknown>;
    const internalSecret = Deno.env.get("AI_CHAT_INTERNAL_SECRET");
    const fromInternal = typeof body._internal_secret === "string" && internalSecret !== undefined && body._internal_secret === internalSecret;
    if (fromInternal) {
      delete body._internal_secret;
    } else {
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.replace(/^Bearer\s+/i, "")?.trim();
      if (!token) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
      const authClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        anonKey ?? "",
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: { user }, error: authError } = await authClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const conversation_id = body.conversation_id ?? body.conversationId;
    const message = body.message;
    const skipCustomerInsert = Boolean(body.skip_customer_insert);

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

    // 5. Buscar produtos (estoque e preço) para o cliente perguntar disponibilidade e preço
    const msgLower = message.toLowerCase().trim();
    const wantsProductInfo =
      /\b(preço|preco|valor|quanto custa|custa|tem (em )?estoque|disponível|disponivel|produto|produtos|catálogo|catalogo)\b/.test(msgLower);
    let productsContext = "Nenhum produto listado.";
    if (wantsProductInfo) {
      let productsQuery = supabaseClient
        .from("products")
        .select("name, price, stock, category")
        .eq("is_active", true)
        .limit(40);
      // Busca por termo se a mensagem tiver mais de 2 caracteres (ex.: nome de produto ou categoria)
      const words = message.split(/\s+/).filter((w) => w.length > 2);
      if (words.length > 0) {
        const term = words[0];
        productsQuery = productsQuery.or(
          `name.ilike.%${term}%,category.ilike.%${term}%`
        );
      }
      const { data: products } = await productsQuery;
      if (products?.length) {
        productsContext = products
          .map(
            (p: { name: string; price: number; stock: number; category: string | null }) =>
              `- ${p.name}: R$ ${Number(p.price).toFixed(2)}, estoque: ${p.stock > 0 ? "sim" : "indisponível"}${p.category ? ` (${p.category})` : ""}`
          )
          .join("\n");
      }
    }

    // 6. Construir o Contexto e Prompt
    const contextText =
      documents?.map((d) => `[FONTE: ${d.title}]\n${d.content}`).join("\n\n") ??
      "Nenhum contexto encontrado.";

    const systemContent = wantsProductInfo
      ? `Você é o assistente técnico da Aquimaq. Use o contexto abaixo para responder. Quando o cliente perguntar sobre produtos, preços ou estoque, use a lista PRODUTOS E ESTOQUE.
Se não souber, diga que não encontrou a informação e encaminhe para um humano.

PRODUTOS E ESTOQUE:
${productsContext}

CONTEXTO (manuais/bulas):
${contextText}`
      : `Você é o assistente técnico da Aquimaq. Use o contexto abaixo para responder.
Se não souber, diga que não encontrou a informação e encaminhe para um humano.
CONTEXTO:\n${contextText}`;

    const handoffInstruction = `
Responda em JSON com exatamente duas chaves: "reply" (string: sua mensagem ao cliente) e "request_human" (boolean: true se não souber ajudar ou o cliente pedir para falar com um humano; caso contrário false).
Exemplo: {"reply": "Encontrei a informação...", "request_human": false}
Se for transferir para humano, inclua na "reply" uma frase como "Um atendente vai ajudar em breve."`;

    const messages = [
      {
        role: "system",
        content: systemContent + handoffInstruction,
      },
      ...([...(history ?? [])].reverse().map((m) => ({
        role: m.sender_type === "customer" ? "user" : "assistant",
        content: m.content,
      }))),
      { role: "user", content: message },
    ];

    // 7. Gerar Resposta Final (structured: reply + request_human; fallback sem schema se o modelo não suportar)
    const model = settings.model || "gpt-4o-mini";
    const bodyWithSchema = {
      model,
      messages,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "chat_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              reply: { type: "string", description: "Resposta ao cliente" },
              request_human: { type: "boolean", description: "True se deve transferir para atendente humano" },
            },
            required: ["reply", "request_human"],
            additionalProperties: false,
          },
        },
      },
    };
    let chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyWithSchema),
    });
    let chatData = await chatRes.json();
    if (chatData.error && chatRes.status >= 400) {
      chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, temperature: 0.2 }),
      });
      chatData = await chatRes.json();
    }
    const content = chatData.choices?.[0]?.message?.content;
    let reply: string;
    let requestHuman = false;
    try {
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      reply = typeof parsed?.reply === "string" ? parsed.reply : String(content ?? "Desculpe, ocorreu um erro.");
      requestHuman = Boolean(parsed?.request_human);
    } catch {
      reply = typeof content === "string" ? content : "Desculpe, ocorreu um erro.";
    }

    // 8. Se handoff, atualizar conversa para waiting_human e opcionalmente atribuir vendedor
    if (requestHuman) {
      const { data: conv } = await supabaseClient
        .from("chat_conversations")
        .select("id, channel, contact_phone")
        .eq("id", conversation_id)
        .single();
      const { data: nextAgent } = await supabaseClient.rpc("next_vendedor_for_handoff", { last_agent_id: null });
      const assigned = nextAgent ?? null;
      await supabaseClient
        .from("chat_conversations")
        .update({
          status: assigned ? "active" : "waiting_human",
          current_queue_state: assigned ? "assigned" : "waiting_human",
          assigned_agent: assigned,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversation_id);
      if (conv?.channel === "whatsapp" && conv?.contact_phone) {
        await supabaseClient
          .from("whatsapp_sessions")
          .update({
            human_mode: Boolean(nextAgent),
            assigned_agent: nextAgent ?? null,
            last_handoff_at: new Date().toISOString(),
          })
          .eq("conversation_id", conversation_id);
        if (nextAgent) {
          await supabaseClient.from("chat_assignment_events").insert({
            conversation_id,
            from_agent: null,
            to_agent: nextAgent,
            reason: "auto_handoff",
          });
        }
      }
    }

    // 9. Salvar Mensagens no Banco
    const rows = [
      !skipCustomerInsert
        ? { conversation_id, content: message, sender_type: "customer" }
        : null,
      { conversation_id, content: reply, sender_type: "ai_agent", delivery_status: "sent", metadata: { channel: "web_or_whatsapp" } },
    ].filter(Boolean);

    await supabaseClient.from("chat_messages").insert(rows as Record<string, unknown>[]);

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

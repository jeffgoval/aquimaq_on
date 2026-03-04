import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-whatsapp-signature",
};

type InboundBody = {
  message_id?: string;
  from_phone?: string;
  text?: string;
  timestamp?: string;
  event_type?: string;
};

function json(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return json(500, { error: "Server configuration error" });

  const secret = Deno.env.get("WHATSAPP_INBOUND_SECRET");
  const allowedOrigins = (Deno.env.get("WHATSAPP_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const requestOrigin = req.headers.get("origin") ?? "";
  if (allowedOrigins.length > 0 && requestOrigin && !allowedOrigins.includes(requestOrigin)) {
    return json(403, { error: "Origin not allowed" });
  }

  const rawBody = await req.text();
  if (secret) {
    const provided = req.headers.get("x-whatsapp-signature");
    const expected = await sha256(`${rawBody}${secret}`);
    if (!provided || provided !== expected) return json(401, { error: "Invalid signature" });
  }

  let body: InboundBody;
  try {
    body = JSON.parse(rawBody) as InboundBody;
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const messageId = body.message_id?.trim();
  const text = body.text?.trim();
  const phone = normalizePhone(body.from_phone ?? "");
  const eventType = (body.event_type ?? "message").toLowerCase();
  if (!messageId || !text || !phone) return json(400, { error: "message_id, from_phone and text are required" });
  if (eventType !== "message") return json(200, { ignored: true });

  const supabase = createClient(supabaseUrl, serviceRole);

  const { data: existingMsg } = await supabase
    .from("chat_messages")
    .select("id, conversation_id")
    .eq("external_message_id", messageId)
    .maybeSingle();
  if (existingMsg?.id) {
    const { data: c } = await supabase
      .from("chat_conversations")
      .select("id, assigned_agent")
      .eq("id", existingMsg.conversation_id)
      .maybeSingle();
    return json(200, {
      conversation_id: existingMsg.conversation_id,
      routing: c?.assigned_agent ? "human" : "ai",
      assigned_agent: c?.assigned_agent ?? null,
      duplicate: true,
    });
  }

  const { data: sessionRow } = await supabase
    .from("whatsapp_sessions")
    .select("id, conversation_id, human_mode, assigned_agent, unread_count")
    .eq("phone", phone)
    .maybeSingle();

  let conversationId = sessionRow?.conversation_id ?? null;
  let assignedAgent = sessionRow?.assigned_agent ?? null;
  let humanMode = sessionRow?.human_mode ?? false;

  if (!conversationId) {
    const { data: lastSession } = await supabase
      .from("whatsapp_sessions")
      .select("assigned_agent")
      .not("assigned_agent", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: rrAgent } = await supabase.rpc("next_vendedor_for_handoff", {
      last_agent_id: lastSession?.assigned_agent ?? null,
    });
    assignedAgent = rrAgent ?? null;
    humanMode = Boolean(assignedAgent);

    const { data: conv, error: convError } = await supabase
      .from("chat_conversations")
      .insert({
        customer_id: null,
        status: humanMode ? "active" : "waiting_human",
        channel: "whatsapp",
        subject: "Atendimento WhatsApp",
        contact_phone: phone,
        assigned_agent: assignedAgent,
        current_queue_state: humanMode ? "assigned" : "bot",
      })
      .select("id")
      .single();
    if (convError || !conv?.id) return json(500, { error: convError?.message ?? "Failed to create conversation" });
    conversationId = conv.id;

    await supabase.from("whatsapp_sessions").upsert({
      phone,
      conversation_id: conversationId,
      human_mode: humanMode,
      assigned_agent: assignedAgent,
      last_customer_message_at: body.timestamp ?? new Date().toISOString(),
      unread_count: 1,
    }, { onConflict: "phone" });

    if (assignedAgent) {
      await supabase.from("chat_assignment_events").insert({
        conversation_id: conversationId,
        from_agent: null,
        to_agent: assignedAgent,
        reason: "round_robin_new_conversation",
      });
    }
  } else {
    await supabase
      .from("whatsapp_sessions")
      .update({
        last_customer_message_at: body.timestamp ?? new Date().toISOString(),
        unread_count: (sessionRow?.unread_count ?? 0) + 1,
      })
      .eq("phone", phone);
  }

  const { error: msgError } = await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    sender_type: "customer",
    content: text,
    external_message_id: messageId,
    delivery_status: "delivered",
    metadata: { event_type: eventType, channel: "whatsapp", source: "evolution" },
  });
  if (msgError) return json(500, { error: msgError.message });

  await supabase
    .from("chat_conversations")
    .update({
      updated_at: new Date().toISOString(),
      current_queue_state: humanMode ? "assigned" : "bot",
      status: humanMode ? "active" : "waiting_human",
    })
    .eq("id", conversationId);

  let routing: "ai" | "human" = humanMode ? "human" : "ai";

  if (!humanMode) {
    const { data: aiData, error: aiError } = await supabase.functions.invoke("ai-chat", {
      body: { conversation_id: conversationId, message: text, skip_customer_insert: true },
    });
    if (aiError) {
      routing = "human";
      await supabase
        .from("chat_conversations")
        .update({
          status: "waiting_human",
          current_queue_state: "waiting_human",
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    } else {
      const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
      const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
      const evolutionInstance = Deno.env.get("EVOLUTION_INSTANCE");
      if (evolutionUrl && evolutionKey && evolutionInstance && typeof aiData?.reply === "string") {
        let deliveryStatus: "sent" | "failed" = "failed";
        let providerResponse: unknown = null;
        try {
          const sendRes = await fetch(
            `${evolutionUrl.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(evolutionInstance)}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": evolutionKey,
              },
              body: JSON.stringify({
                number: phone,
                options: { delay: 1200 },
                text: aiData.reply,
              }),
            },
          );
          providerResponse = await sendRes.json().catch(() => ({}));
          deliveryStatus = sendRes.ok ? "sent" : "failed";
        } catch {
          deliveryStatus = "failed";
        }

        const { data: lastAi } = await supabase
          .from("chat_messages")
          .select("id")
          .eq("conversation_id", conversationId)
          .eq("sender_type", "ai_agent")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastAi?.id) {
          await supabase
            .from("chat_messages")
            .update({
              delivery_status: deliveryStatus,
              metadata: {
                channel: "whatsapp",
                provider: "evolution",
                provider_response: providerResponse,
              },
            })
            .eq("id", lastAi.id);
        }
      }
    }
  }

  return json(200, {
    conversation_id: conversationId,
    routing,
    assigned_agent: assignedAgent,
  });
});

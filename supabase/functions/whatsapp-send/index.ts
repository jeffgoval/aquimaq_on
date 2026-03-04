import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type SendBody = {
  conversation_id?: string;
  content?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
  const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
  const evolutionInstance = Deno.env.get("EVOLUTION_INSTANCE");
  if (!supabaseUrl || !anonKey || !serviceRole) return json(500, { error: "Server configuration error" });

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData?.user) return json(401, { error: "Not authenticated" });

  const adminClient = createClient(supabaseUrl, serviceRole);
  const userId = authData.user.id;
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (!profile || !["vendedor", "gerente", "admin"].includes(profile.role)) {
    return json(403, { error: "Forbidden" });
  }

  let body: SendBody;
  try {
    body = await req.json() as SendBody;
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const conversationId = body.conversation_id?.trim();
  const content = body.content?.trim();
  if (!conversationId || !content) return json(400, { error: "conversation_id and content are required" });

  const { data: conversation, error: convError } = await adminClient
    .from("chat_conversations")
    .select("id, assigned_agent, channel, contact_phone, status")
    .eq("id", conversationId)
    .maybeSingle();
  if (convError || !conversation) return json(404, { error: convError?.message ?? "Conversation not found" });
  if (conversation.channel !== "whatsapp") return json(400, { error: "Conversation is not WhatsApp channel" });
  if (conversation.status === "closed") return json(409, { error: "Conversation is closed" });

  if (profile.role === "vendedor" && conversation.assigned_agent !== userId) {
    return json(403, { error: "Vendedor can only send messages to assigned conversations" });
  }

  if (!conversation.contact_phone) return json(400, { error: "Conversation has no contact phone" });
  if (!evolutionUrl || !evolutionKey || !evolutionInstance) {
    return json(500, { error: "Evolution API is not configured" });
  }

  const externalMessageId = crypto.randomUUID();
  let providerStatus = "failed";
  let providerResponse: Record<string, unknown> | null = null;

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
          number: conversation.contact_phone,
          options: { delay: 1200 },
          text: content,
        }),
      },
    );
    providerResponse = await sendRes.json().catch(() => ({}));
    providerStatus = sendRes.ok ? "sent" : "failed";
  } catch {
    providerStatus = "failed";
  }

  const { error: insertError } = await adminClient.from("chat_messages").insert({
    conversation_id: conversationId,
    sender_type: "human_agent",
    sender_id: userId,
    content,
    external_message_id: externalMessageId,
    delivery_status: providerStatus,
    metadata: {
      channel: "whatsapp",
      provider: "evolution",
      provider_response: providerResponse,
    },
  });
  if (insertError) return json(500, { error: insertError.message });

  await adminClient
    .from("chat_conversations")
    .update({
      status: "active",
      current_queue_state: "assigned",
      assigned_agent: conversation.assigned_agent ?? userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  await adminClient
    .from("whatsapp_sessions")
    .update({
      human_mode: true,
      assigned_agent: conversation.assigned_agent ?? userId,
      unread_count: 0,
    })
    .eq("conversation_id", conversationId);

  return json(providerStatus === "sent" ? 200 : 502, {
    provider_message_id: externalMessageId,
    status: providerStatus,
  });
});

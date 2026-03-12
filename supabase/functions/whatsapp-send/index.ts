/**
 * whatsapp-send — Envia mensagem WhatsApp via Chatwoot.
 *
 * Chamada pelo n8n com payload:
 *   { phone: string, message: string, contact_name?: string }
 *
 * Variáveis de ambiente necessárias (Supabase secrets):
 *   CHATWOOT_URL             — ex: https://app.chatwoot.com
 *   CHATWOOT_API_TOKEN       — User Access Token do agente/bot
 *   CHATWOOT_ACCOUNT_ID      — ID da conta Chatwoot
 *   CHATWOOT_WHATSAPP_INBOX_ID — ID da caixa de entrada WhatsApp
 *
 * Fluxo:
 *   1. Busca contato pelo telefone (ou cria se não existir)
 *   2. Cria conversa outbound na inbox WhatsApp
 *   3. Envia mensagem
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface SendPayload {
    phone: string;
    message: string;
    contact_name?: string;
}

function corsHeaders(origin: string) {
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Vary": "Origin",
    };
}

function json(data: unknown, status = 200, origin = "*") {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
}

async function chatwootGet(base: string, token: string, path: string) {
    const res = await fetch(`${base}${path}`, {
        headers: { "api_access_token": token, "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Chatwoot GET ${path} → ${res.status}`);
    return res.json();
}

async function chatwootPost(base: string, token: string, path: string, body: unknown) {
    const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "api_access_token": token, "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Chatwoot POST ${path} → ${res.status}: ${err}`);
    }
    return res.json();
}

Deno.serve(async (req) => {
    const origin = req.headers.get("Origin") ?? "*";

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders(origin) });
    }
    if (req.method !== "POST") {
        return json({ error: "Method not allowed" }, 405, origin);
    }

    const chatwootUrl  = Deno.env.get("CHATWOOT_URL");
    const apiToken     = Deno.env.get("CHATWOOT_API_TOKEN");
    const accountId    = Deno.env.get("CHATWOOT_ACCOUNT_ID");
    const inboxId      = Deno.env.get("CHATWOOT_WHATSAPP_INBOX_ID");

    if (!chatwootUrl || !apiToken || !accountId || !inboxId) {
        return json({ error: "WhatsApp not configured (missing Chatwoot env vars)" }, 503, origin);
    }

    let payload: SendPayload;
    try {
        payload = await req.json();
    } catch {
        return json({ error: "Invalid JSON body" }, 400, origin);
    }

    const { phone, message, contact_name } = payload;
    if (!phone?.trim() || !message?.trim()) {
        return json({ error: "phone and message are required" }, 400, origin);
    }

    // Normalizar telefone: apenas dígitos, sem +
    const phoneNorm = phone.replace(/\D/g, "");

    const base = `${chatwootUrl.replace(/\/$/, "")}/api/v1/accounts/${accountId}`;

    try {
        // 1. Buscar contato existente pelo telefone
        let contactId: number | null = null;
        try {
            const search = await chatwootGet(base, apiToken, `/contacts/search?q=${phoneNorm}&page=1`);
            const match = (search?.payload ?? []).find(
                (c: { phone_number?: string }) => c.phone_number?.replace(/\D/g, "") === phoneNorm
            );
            if (match) contactId = match.id;
        } catch { /* nenhum contato encontrado */ }

        // 2. Criar contato se não existe
        if (!contactId) {
            const created = await chatwootPost(base, apiToken, "/contacts", {
                name: contact_name ?? phoneNorm,
                phone_number: `+${phoneNorm}`,
            });
            contactId = created?.id ?? created?.contact?.id;
        }

        if (!contactId) {
            return json({ error: "Could not find or create Chatwoot contact" }, 500, origin);
        }

        // 3. Criar conversa outbound
        const conversation = await chatwootPost(base, apiToken, `/contacts/${contactId}/conversations`, {
            inbox_id: Number(inboxId),
        });
        const conversationId = conversation?.id;
        if (!conversationId) {
            return json({ error: "Could not create Chatwoot conversation" }, 500, origin);
        }

        // 4. Enviar mensagem
        await chatwootPost(base, apiToken, `/conversations/${conversationId}/messages`, {
            content: message,
            message_type: "outgoing",
            private: false,
        });

        return json({ ok: true, contact_id: contactId, conversation_id: conversationId }, 200, origin);

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("whatsapp-send error:", msg);
        return json({ error: msg }, 500, origin);
    }
});

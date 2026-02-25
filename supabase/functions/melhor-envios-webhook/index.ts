import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map Melhor Envio order events to our order status
const ME_EVENT_TO_STATUS: Record<string, string> = {
    "order.created": "etiqueta_criada",
    "order.released": "etiqueta_paga",
    "order.generated": "etiqueta_gerada",
    "order.posted": "postado",
    "order.delivered": "entregue",
    "order.cancelled": "cancelado",
    "order.undelivered": "nao_entregue",
    "order.pending": "aguardando_pagamento",
};

/**
 * Verify HMAC-SHA256 signature from Melhor Envio.
 * Header: X-ME-Signature
 * Key: MELHOR_ENVIOS_SECRET (app secret from ME developer panel)
 * Message: raw request body
 */
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expected = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
    return expected === signature;
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const rawBody = await req.text();

    // Validate X-ME-Signature per official Melhor Envio webhook docs
    const meSignature = req.headers.get("X-ME-Signature") ?? req.headers.get("x-me-signature");
    const meSecret = Deno.env.get("MELHOR_ENVIOS_WEBHOOK_SECRET");

    if (meSecret && meSignature) {
        const valid = await verifySignature(rawBody, meSignature, meSecret);
        if (!valid) {
            console.error("Invalid X-ME-Signature");
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
    } else if (meSecret && !meSignature) {
        console.error("Missing X-ME-Signature header");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    let payload: { event?: string; data?: Record<string, unknown> };
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const { event, data } = payload;
    console.log("ME Webhook received:", event, JSON.stringify(data));

    if (!event || !data) {
        return new Response(JSON.stringify({ error: "Missing event or data" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
        return new Response(JSON.stringify({ error: "Server configuration error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const meOrderId = data.id as string | undefined;
    const newStatus = ME_EVENT_TO_STATUS[event];
    const tracking = (data.tracking ?? data.self_tracking) as string | null;
    const trackingUrl = data.tracking_url as string | null;

    if (!meOrderId) {
        console.warn("No order id in ME webhook payload");
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Find the matching order via me_order_id tag in shipping_address or via payments
    // ME order id is stored in orders.me_order_id (if column exists) or we log and return 200
    const updatePayload: Record<string, unknown> = {};

    if (newStatus) {
        updatePayload.shipping_status = newStatus;
    }
    if (tracking) {
        updatePayload.tracking_code = tracking;
    }
    if (trackingUrl) {
        updatePayload.tracking_url = trackingUrl;
    }
    updatePayload.updated_at = new Date().toISOString();

    // Look up order by me_order_id column
    const { error: updateError } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("me_order_id", meOrderId);

    if (updateError) {
        // Column may not exist yet — log and return 200 to avoid ME retries
        console.warn("Could not update order by me_order_id:", updateError.message);
    } else {
        console.log(`Order ${meOrderId} updated: status=${newStatus}, tracking=${tracking}`);
    }

    // Always return 200 so ME does not retry
    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
});

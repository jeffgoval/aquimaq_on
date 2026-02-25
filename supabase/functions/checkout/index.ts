import { createClient } from "npm:@supabase/supabase-js@2";
import { MercadoPagoConfig, Preference } from "npm:mercadopago@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderPayload {
    subtotal: number;
    shipping_cost: number;
    total: number;
    shipping_method?: string | null;
    shipping_address?: {
        street?: string | null;
        number?: string | null;
        neighborhood?: string | null;
        city?: string | null;
        state?: string | null;
        zip_code?: string | null;
    } | null;
}

interface MPItem {
    id?: string;
    title: string;
    description?: string;
    quantity: number;
    unit_price: number;
    currency_id?: string;
}

interface CheckoutBody {
    order: OrderPayload;
    items: MPItem[];
    back_url_base: string;
}

function parseBody(body: unknown): CheckoutBody | null {
    if (!body || typeof body !== "object") return null;
    const b = body as Record<string, unknown>;
    if (!b.order || typeof b.order !== "object") return null;
    if (!Array.isArray(b.items) || b.items.length === 0) return null;
    const order = b.order as OrderPayload;
    if (
        typeof order.subtotal !== "number" ||
        typeof order.shipping_cost !== "number" ||
        typeof order.total !== "number"
    ) return null;
    if (typeof b.back_url_base !== "string" || !b.back_url_base.trim()) return null;
    const base = (b.back_url_base as string).trim().replace(/\/$/, "");
    return {
        order,
        items: b.items as MPItem[],
        back_url_base: base,
    };
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
        return new Response(JSON.stringify({ error: "Server configuration error" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Authenticate user via the Authorization header (verify_jwt=false, auth handled here)
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
        return new Response(JSON.stringify({ error: "Você precisa estar logado para finalizar a compra." }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    let body: unknown;
    try { body = await req.json(); }
    catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const payload = parseBody(body);
    if (!payload) {
        return new Response(
            JSON.stringify({ error: "Body must include order, items, and back_url_base" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
        return new Response(JSON.stringify({ error: "Payment provider not configured" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
        return new Response(JSON.stringify({ error: "Server configuration error" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Create order in Supabase
    const { data: orderRow, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
            cliente_id: user.id,
            status: "aguardando_pagamento",
            subtotal: payload.order.subtotal,
            shipping_cost: payload.order.shipping_cost,
            total: payload.order.total,
            shipping_method: payload.order.shipping_method ?? null,
            shipping_address: payload.order.shipping_address ?? null,
            payment_method: "mercado_pago",
        })
        .select("id")
        .single();

    if (orderError || !orderRow?.id) {
        return new Response(
            JSON.stringify({ error: orderError?.message ?? "Failed to create order" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // 2. Insert order_items (exclude the shipping pseudo-item)
    const orderItems = payload.items
        .filter((item) => item.id !== "shipping")
        .map((item) => ({
            order_id: orderRow.id,
            product_id: item.id ?? null,
            product_name: item.title,
            quantity: item.quantity,
            unit_price: item.unit_price,
        }));
    if (orderItems.length > 0) {
        await supabaseAdmin.from("order_items").insert(orderItems);
    }

    // 3. Create Mercado Pago preference
    const backUrls = {
        success: `${payload.back_url_base}/pagamento/sucesso`,
        failure: `${payload.back_url_base}/pagamento/falha`,
        pending: `${payload.back_url_base}/pagamento/pendente`,
    };

    const webhookUrl = `${supabaseUrl}/functions/v1/mercado-pago-webhook`;
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const itemsWithCurrency = payload.items.map((item) => ({
        ...item,
        currency_id: "BRL",
    }));

    let mpResponse: { id?: string; init_point?: string; sandbox_init_point?: string };
    try {
        mpResponse = await preference.create({
            body: {
                items: itemsWithCurrency,
                external_reference: orderRow.id,
                statement_descriptor: "AQUIMAQ",
                back_urls: backUrls,
                notification_url: webhookUrl,
                // payer omitted — avoids "uma das partes é de teste" sandbox error
                // auto_return omitted — requires public HTTPS URLs
            },
        });
    } catch (err: any) {
        const errorDetails = err?.cause ?? err?.message ?? JSON.stringify(err);
        return new Response(
            JSON.stringify({ error: "Failed to create payment preference", details: errorDetails }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Use init_point (production checkout) — avoids ERR_TOO_MANY_REDIRECTS
    // that occurs with sandbox_init_point in browsers with conflicting sessions.
    const checkoutUrl = mpResponse.init_point ?? mpResponse.sandbox_init_point;
    if (!checkoutUrl) {
        return new Response(
            JSON.stringify({ error: "Payment provider did not return checkout URL" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // 4. Create initial payment record
    await supabaseAdmin.from("payments").insert({
        order_id: orderRow.id,
        mp_preference_id: mpResponse.id ?? null,
        mp_checkout_url: checkoutUrl,
        status: "pending",
        amount: payload.order.total,
    });

    return new Response(
        JSON.stringify({ order_id: orderRow.id, checkout_url: checkoutUrl }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
});

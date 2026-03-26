import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function getAllowedOrigin(req: Request): string {
    const origin = req.headers.get("Origin") ?? "";
    const prodOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "https://aquimaq.com.br";
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    return (isLocalhost || origin === prodOrigin) ? origin : prodOrigin;
}

const IS_PRODUCTION = Deno.env.get("PRODUCTION_MELHOR_ENVIO") === "true";
const ME_API_BASE = IS_PRODUCTION
    ? "https://www.melhorenvio.com.br/api/v2"
    : "https://sandbox.melhorenvio.com.br/api/v2";

Deno.serve(async (req) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": getAllowedOrigin(req),
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Vary": "Origin",
    };

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
        return new Response(JSON.stringify({ error: "Token de autenticação não enviado." }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const meToken = Deno.env.get("MELHOR_ENVIO_TOKEN");

    if (!meToken) {
        return new Response(JSON.stringify({ error: "Token do Melhor Envios não configurado." }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Valida o JWT do usuário
    const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
        return new Response(JSON.stringify({ error: "Sessão inválida. Faça login novamente." }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Verifica se é staff (admin / gerente / vendedor)
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    const role = profile?.role ?? null;
    const isStaff = role === "admin" || role === "gerente" || role === "vendedor";
    if (!isStaff) {
        return new Response(JSON.stringify({ error: "Sem permissão para esta ação." }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // ── Body ──────────────────────────────────────────────────────────────
    let body: { orderId?: string };
    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: "JSON inválido no corpo da requisição." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (!body.orderId) {
        return new Response(JSON.stringify({ error: "orderId é obrigatório." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // ── Busca me_order_id no DB ───────────────────────────────────────────
    const { data: order, error: orderError } = await adminSupabase
        .from("orders")
        .select("id, me_order_id")
        .eq("id", body.orderId)
        .maybeSingle();

    if (orderError || !order) {
        return new Response(JSON.stringify({ error: "Pedido não encontrado." }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (!order.me_order_id) {
        return new Response(JSON.stringify({ error: "Este pedido não possui etiqueta gerada no Melhor Envios." }), {
            status: 422,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // ── Busca rastreio na API ME ──────────────────────────────────────────
    const meRes = await fetch(`${ME_API_BASE}/me/orders/${encodeURIComponent(order.me_order_id)}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${meToken}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "AquimaqApp (suporte@aquimaq.com.br)",
        },
    });

    const meText = await meRes.text().catch(() => "");
    if (!meRes.ok) {
        console.error(`ME orders/${order.me_order_id} failed (${meRes.status}): ${meText}`);
        return new Response(JSON.stringify({ error: `Melhor Envios retornou erro ${meRes.status}. Tente novamente.` }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    let meOrder: Record<string, unknown>;
    try {
        meOrder = JSON.parse(meText) as Record<string, unknown>;
    } catch {
        return new Response(JSON.stringify({ error: "Resposta inválida do Melhor Envios." }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const trackingCode = (meOrder.tracking ?? meOrder.self_tracking ?? null) as string | null;
    const trackingUrl = (meOrder.tracking_url ?? null) as string | null;

    // ── Persiste no DB ────────────────────────────────────────────────────
    if (trackingCode || trackingUrl) {
        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (trackingCode) patch.tracking_code = trackingCode;
        if (trackingUrl) patch.tracking_url = trackingUrl;
        await adminSupabase.from("orders").update(patch).eq("id", body.orderId);
    }

    return new Response(JSON.stringify({ trackingCode, trackingUrl }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
});

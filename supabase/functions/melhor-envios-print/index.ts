import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ME_API_BASE = "https://melhorenvios.com.br/api/v2";

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // Autenticar usuário via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const meToken = Deno.env.get("MELHOR_ENVIOS_TOKEN");

    if (!meToken) {
        return new Response(JSON.stringify({ error: "MELHOR_ENVIOS_TOKEN not configured" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Verificar que o usuário é admin/gerente
    const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    const allowedRoles = ["admin", "gerente", "vendedor"];
    if (!profile || !allowedRoles.includes(profile.role)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Parse body: espera { orderId: string } — ID interno do pedido no Supabase
    let body: { orderId?: string };
    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (!body.orderId) {
        return new Response(JSON.stringify({ error: "orderId is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Buscar me_order_id no banco
    const { data: order, error: orderError } = await adminSupabase
        .from("orders")
        .select("id, me_order_id, tracking_code")
        .eq("id", body.orderId)
        .maybeSingle();

    if (orderError || !order) {
        return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const meOrderId = order.me_order_id;
    if (!meOrderId) {
        return new Response(JSON.stringify({ error: "Etiqueta Melhor Envios não gerada para este pedido" }), {
            status: 422,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Chamar API do Melhor Envios: POST /api/v2/me/shipment/print
    const printResponse = await fetch(`${ME_API_BASE}/me/shipment/print`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${meToken}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "AquimaqApp (suporte@aquimaq.com.br)",
        },
        body: JSON.stringify({
            orders: [meOrderId],
            mode: "public/pdf",
        }),
    });

    if (!printResponse.ok) {
        const errText = await printResponse.text().catch(() => "");
        console.error("ME print API error:", printResponse.status, errText);
        return new Response(JSON.stringify({ error: "Falha ao gerar etiqueta no Melhor Envios", detail: errText }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // ME retorna a URL do PDF diretamente como string ou JSON com campo "url"
    const contentType = printResponse.headers.get("content-type") ?? "";
    let pdfUrl: string;

    if (contentType.includes("application/json")) {
        const json = await printResponse.json();
        pdfUrl = json.url ?? json.link ?? json;
    } else {
        pdfUrl = (await printResponse.text()).trim().replace(/^"|"$/g, "");
    }

    if (!pdfUrl || typeof pdfUrl !== "string" || !pdfUrl.startsWith("http")) {
        return new Response(JSON.stringify({ error: "URL do PDF inválida retornada pelo Melhor Envios" }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ url: pdfUrl }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
});

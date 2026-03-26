import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/** Retorna o origin permitido: domínio de produção ou localhost em desenvolvimento. */
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

function meHeaders(token: string): HeadersInit {
    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "AquimaqApp (suporte@aquimaq.com.br)",
    };
}

/**
 * Executa o fluxo completo de geração de etiqueta no Melhor Envios:
 * 1. Checkout (pagar do saldo ME)
 * 2. Generate (gerar a etiqueta)
 * 3. Print (obter URL do PDF)
 *
 * As etapas 1 e 2 são idempotentes no ME — se já executadas anteriormente não causam erro.
 * Falhas em checkout/generate são logadas mas não bloqueiam o print (reimpressão é permitida).
 */
async function runMeFullPrintFlow(meOrderId: string, token: string): Promise<string> {
    // 1. Checkout: pagar a etiqueta do saldo ME
    try {
        const checkoutRes = await fetch(`${ME_API_BASE}/me/shipment/checkout`, {
            method: "POST",
            headers: meHeaders(token),
            body: JSON.stringify({ orders: [meOrderId], payment_method: "wallet" }),
        });
        if (!checkoutRes.ok) {
            const errText = await checkoutRes.text().catch(() => "");
            console.warn(`ME checkout warning (${checkoutRes.status}): ${errText}`);
        } else {
            console.log(`ME checkout ok for order ${meOrderId}`);
        }
    } catch (e) {
        console.warn("ME checkout exception:", e);
    }

    // 2. Generate: gerar a etiqueta
    try {
        const generateRes = await fetch(`${ME_API_BASE}/me/shipment/generate`, {
            method: "POST",
            headers: meHeaders(token),
            body: JSON.stringify({ orders: [meOrderId] }),
        });
        if (!generateRes.ok) {
            const errText = await generateRes.text().catch(() => "");
            console.warn(`ME generate warning (${generateRes.status}): ${errText}`);
        } else {
            console.log(`ME generate ok for order ${meOrderId}`);
        }
    } catch (e) {
        console.warn("ME generate exception:", e);
    }

    // 3. Print (arquivo): obter URL direta do PDF
    // Docs: GET /api/v2/me/imprimir/pdf/{id} -> retorna uma URL (string) para S3
    const printRes = await fetch(`${ME_API_BASE}/me/imprimir/pdf/${meOrderId}`, {
        method: "GET",
        headers: meHeaders(token),
    });

    if (!printRes.ok) {
        const errText = await printRes.text().catch(() => "");
        throw new Error(`ME print failed (${printRes.status}): ${errText}`);
    }

    const contentType = printRes.headers.get("content-type") ?? "";
    let pdfUrl: string;
    if (contentType.includes("application/json")) {
        // pode vir como string JSON (ex: "https://...") ou objeto
        const json = await printRes.json();
        pdfUrl = typeof json === "string" ? json : (json.url ?? json.link ?? "");
    } else {
        pdfUrl = (await printRes.text()).trim().replace(/^"|"$/g, "");
    }

    if (!pdfUrl || typeof pdfUrl !== "string" || !pdfUrl.startsWith("http")) {
        throw new Error(`URL do PDF inválida retornada pelo Melhor Envios: ${pdfUrl}`);
    }

    return pdfUrl;
}

Deno.serve(async (req) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": getAllowedOrigin(req),
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Vary": "Origin",
    };

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
    const meToken = Deno.env.get("MELHOR_ENVIO_TOKEN");

    if (!meToken) {
        return new Response(JSON.stringify({ error: "MELHOR_ENVIO_TOKEN not configured" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Verificar que o usuário é admin/gerente/vendedor
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

    // Parse body: espera { orderId: string }
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

    try {
        const pdfUrl = await runMeFullPrintFlow(meOrderId, meToken);
        return new Response(JSON.stringify({ url: pdfUrl }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("ME print flow error:", message);
        return new Response(JSON.stringify({ error: "Falha ao gerar etiqueta no Melhor Envios", detail: message }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

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

/** Erro do fluxo ME: permite mapear 422 (pré-requisito/validação) vs 502 (falha após pipeline válido). */
class MelhorEnvioFlowError extends Error {
    readonly httpStatus: number;
    constructor(message: string, httpStatus: number) {
        super(message);
        this.name = "MelhorEnvioFlowError";
        this.httpStatus = httpStatus;
    }
}

function meHeaders(token: string): HeadersInit {
    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "AquimaqApp (suporte@aquimaq.com.br)",
    };
}

/** Extrai URL http(s) da resposta JSON da ME (imprimir/pdf pode vir como string, {url}, ou objeto dinâmico). */
function extractHttpUrlFromMeBody(raw: unknown): string {
    if (typeof raw === "string") {
        const t = raw.trim().replace(/^"|"$/g, "");
        if (t.startsWith("http")) return t;
    }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const o = raw as Record<string, unknown>;
        const direct = o.url ?? o.link;
        if (typeof direct === "string" && direct.startsWith("http")) return direct;
        for (const v of Object.values(o)) {
            if (typeof v === "string" && v.startsWith("http")) return v;
        }
    }
    return "";
}

/** POST /me/shipment/print — mode só public | private (doc oficial). */
async function meShipmentPrintPublic(meOrderId: string, token: string): Promise<string> {
    const printRes = await fetch(`${ME_API_BASE}/me/shipment/print`, {
        method: "POST",
        headers: meHeaders(token),
        body: JSON.stringify({ orders: [meOrderId], mode: "public" }),
    });
    const printBody = await printRes.text().catch(() => "");
    if (!printRes.ok) {
        throw new MelhorEnvioFlowError(
            `ME shipment/print failed (${printRes.status}): ${printBody}`,
            502,
        );
    }
    let data: { url?: string };
    try {
        data = JSON.parse(printBody) as { url?: string };
    } catch {
        throw new MelhorEnvioFlowError(
            `ME shipment/print: resposta inválida: ${printBody.slice(0, 500)}`,
            502,
        );
    }
    const url = data?.url;
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
        throw new MelhorEnvioFlowError(
            `ME shipment/print: URL inválida na resposta: ${printBody.slice(0, 500)}`,
            502,
        );
    }
    return url;
}

/**
 * Fluxo alinhado à doc Melhor Envios:
 * 1. checkout (comprar do saldo)
 * 2. generate (obrigatório antes da impressão)
 * 3. GET /me/imprimir/pdf/{id} — sandbox: PDF em arquivo só Jadlog; se 404/422, fallback shipment/print mode public
 *
 * @see https://docs.melhorenvio.com.br/reference/geracao-de-etiquetas
 * @see https://docs.melhorenvio.com.br/reference/impressao-de-etiquetas-em-arquivo
 * @see https://docs.melhorenvio.com.br/reference/impressao-de-etiquetas
 */
async function runMeFullPrintFlow(meOrderId: string, token: string): Promise<string> {
    // 1. Checkout
    const checkoutRes = await fetch(`${ME_API_BASE}/me/shipment/checkout`, {
        method: "POST",
        headers: meHeaders(token),
        body: JSON.stringify({ orders: [meOrderId], payment_method: "wallet" }),
    });
    const checkoutBody = await checkoutRes.text().catch(() => "");
    if (!checkoutRes.ok) {
        throw new MelhorEnvioFlowError(
            `ME checkout failed (${checkoutRes.status}): ${checkoutBody}`,
            422,
        );
    }

    // 2. Generate — doc: resposta 200 com { [orderId]: { status, message } }
    const generateRes = await fetch(`${ME_API_BASE}/me/shipment/generate`, {
        method: "POST",
        headers: meHeaders(token),
        body: JSON.stringify({ orders: [meOrderId] }),
    });
    const generateBodyText = await generateRes.text().catch(() => "");
    if (!generateRes.ok) {
        throw new MelhorEnvioFlowError(
            `ME generate failed (${generateRes.status}): ${generateBodyText}`,
            422,
        );
    }
    let genPayload: Record<string, { status?: boolean; message?: string }>;
    try {
        genPayload = JSON.parse(generateBodyText) as Record<string, { status?: boolean; message?: string }>;
    } catch {
        throw new MelhorEnvioFlowError(
            `ME generate: JSON inválido: ${generateBodyText.slice(0, 500)}`,
            422,
        );
    }
    const genEntry = genPayload[meOrderId];
    if (!genEntry || genEntry.status !== true) {
        const msg = genEntry?.message ?? JSON.stringify(genEntry);
        throw new MelhorEnvioFlowError(
            `ME generate: etiqueta não gerada para ${meOrderId}: ${msg}`,
            422,
        );
    }

    // 3a. Impressão em arquivo PDF (doc: GET /api/v2/me/imprimir/pdf/{id})
    const printRes = await fetch(`${ME_API_BASE}/me/imprimir/pdf/${meOrderId}`, {
        method: "GET",
        headers: meHeaders(token),
    });
    const printBodyText = await printRes.text().catch(() => "");

    if (printRes.ok) {
        const ct = printRes.headers.get("content-type") ?? "";
        let parsed: unknown;
        if (ct.includes("application/json")) {
            try {
                parsed = JSON.parse(printBodyText);
            } catch {
                parsed = printBodyText;
            }
        } else {
            parsed = printBodyText.trim();
        }
        const pdfUrl = extractHttpUrlFromMeBody(parsed);
        if (pdfUrl) return pdfUrl;
        throw new MelhorEnvioFlowError(
            `URL do PDF inválida após imprimir/pdf: ${printBodyText.slice(0, 500)}`,
            502,
        );
    }

    // 3b. Fallback: PDF em arquivo indisponível (ex.: sandbox fora Jadlog) — POST shipment/print mode public
    if (printRes.status === 404 || printRes.status === 422) {
        return await meShipmentPrintPublic(meOrderId, token);
    }

    throw new MelhorEnvioFlowError(
        `ME imprimir/pdf failed (${printRes.status}): ${printBodyText}`,
        502,
    );
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
        const url = await runMeFullPrintFlow(meOrderId, meToken);
        return new Response(JSON.stringify({ url }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("ME print flow error:", message);
        const status = err instanceof MelhorEnvioFlowError ? err.httpStatus : 502;
        return new Response(
            JSON.stringify({ error: "Falha ao gerar etiqueta no Melhor Envios", detail: message }),
            { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
});

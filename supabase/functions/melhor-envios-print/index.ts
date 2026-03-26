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

/** Normaliza string que pode vir com aspas ou barras escapadas (`https:\/\/...`). */
function normalizeMeUrlString(s: string): string {
    return s.trim().replace(/^"|"$/g, "").replace(/\\\//g, "/");
}

/**
 * Extrai URL http(s) da resposta JSON da ME (imprimir/pdf):
 * string direta, array `["https://..."], objeto { url }, ou JSON aninhado em string.
 */
function extractHttpUrlFromMeBody(raw: unknown): string {
    if (typeof raw === "string") {
        const t = normalizeMeUrlString(raw);
        if (t.startsWith("http")) return t;
        if (t.startsWith("[") || t.startsWith("{")) {
            try {
                return extractHttpUrlFromMeBody(JSON.parse(t));
            } catch {
                return "";
            }
        }
        return "";
    }
    if (Array.isArray(raw)) {
        for (const item of raw) {
            const u = extractHttpUrlFromMeBody(item);
            if (u) return u;
        }
        return "";
    }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const o = raw as Record<string, unknown>;
        const direct = o.url ?? o.link;
        if (typeof direct === "string") {
            const u = normalizeMeUrlString(direct);
            if (u.startsWith("http")) return u;
        }
        for (const v of Object.values(o)) {
            if (typeof v === "string") {
                const u = normalizeMeUrlString(v);
                if (u.startsWith("http")) return u;
            }
        }
    }
    return "";
}

/**
 * Checkout retorna 422 quando o envio já foi pago no saldo ME (reimpressão / segundo clique).
 * O body pode vir com acentos UTF-8 ou com escapes JSON (\u00e1); por isso parse + fallback no bruto.
 */
function isMeCheckoutAlreadyPaidOrInvalidOrders(status: number, body: string): boolean {
    if (status !== 422) return false;
    try {
        const j = JSON.parse(body) as { message?: string; errors?: { orders?: string[] } };
        const chunks: string[] = [];
        if (typeof j.message === "string") chunks.push(j.message);
        const ords = j.errors?.orders;
        if (Array.isArray(ords)) chunks.push(...ords.filter((x): x is string => typeof x === "string"));
        const decoded = chunks.join(" ").toLowerCase();
        if (
            decoded.includes("já foram pagas") ||
            decoded.includes("ja foram pagas") ||
            decoded.includes("foram pagas ou inválidas") ||
            decoded.includes("foram pagas ou invalidas")
        ) {
            return true;
        }
    } catch {
        /* ignora parse; usa bruto */
    }
    const b = body.toLowerCase();
    // Texto bruto: "foram pagas" costuma vir em ASCII mesmo quando "já" está como \u00e1
    if (b.includes("foram pagas") && b.includes("orders")) return true;
    if (b.includes("already been paid")) return true;
    return false;
}

/** Remove acentos para comparar mensagens ME (ex.: está → esta). */
function normalizeMeText(s: string): string {
    return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

/**
 * Generate pode devolver 200 com status:false quando o envio/etiqueta já foi gerado antes (reimpressão).
 * Nesse caso seguimos para imprimir/pdf ou shipment/print.
 */
function isMeGenerateShipmentAlreadyGenerated(
    generateOk: boolean,
    bodyText: string,
    meOrderId: string,
    genPayload: Record<string, { status?: boolean; message?: string }> | null,
): boolean {
    const entry = genPayload?.[meOrderId];
    const msgMatches = (msg: string | undefined): boolean => {
        if (!msg) return false;
        const n = normalizeMeText(msg);
        return (
            n.includes("ja esta gerado") ||
            n.includes("ja foi gerado") ||
            n.includes("etiqueta ja") ||
            n.includes("already generated")
        );
    };
    if (entry && msgMatches(entry.message)) return true;
    if (!generateOk && bodyText) {
        if (msgMatches(bodyText)) return true;
        const n = normalizeMeText(bodyText);
        if (n.includes("ja esta gerado") || n.includes("ja foi gerado")) return true;
    }
    return false;
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

type MeOrderDetails = {
    tracking?: string | null;
    self_tracking?: string | null;
    tracking_url?: string | null;
};

async function fetchMeOrderDetails(meOrderId: string, token: string): Promise<MeOrderDetails> {
    const res = await fetch(`${ME_API_BASE}/me/orders/${encodeURIComponent(meOrderId)}`, {
        method: "GET",
        headers: meHeaders(token),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
        throw new MelhorEnvioFlowError(`ME orders/${meOrderId} failed (${res.status}): ${text}`, 502);
    }
    try {
        const j = JSON.parse(text) as Record<string, unknown>;
        return {
            tracking: (j.tracking as string | null | undefined) ?? null,
            self_tracking: (j.self_tracking as string | null | undefined) ?? null,
            tracking_url: (j.tracking_url as string | null | undefined) ?? null,
        };
    } catch {
        throw new MelhorEnvioFlowError(`ME orders/${meOrderId}: resposta inválida: ${text.slice(0, 500)}`, 502);
    }
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
        if (isMeCheckoutAlreadyPaidOrInvalidOrders(checkoutRes.status, checkoutBody)) {
            console.log(`ME checkout skipped (envio já pago ou equivalente): ${meOrderId}`);
        } else {
            throw new MelhorEnvioFlowError(
                `ME checkout failed (${checkoutRes.status}): ${checkoutBody}`,
                422,
            );
        }
    }

    // 2. Generate — doc: resposta 200 com { [orderId]: { status, message } }
    const generateRes = await fetch(`${ME_API_BASE}/me/shipment/generate`, {
        method: "POST",
        headers: meHeaders(token),
        body: JSON.stringify({ orders: [meOrderId] }),
    });
    const generateBodyText = await generateRes.text().catch(() => "");
    let genPayload: Record<string, { status?: boolean; message?: string }> | null = null;
    if (generateBodyText) {
        try {
            genPayload = JSON.parse(generateBodyText) as Record<string, { status?: boolean; message?: string }>;
        } catch {
            genPayload = null;
        }
    }
    const genEntry = genPayload?.[meOrderId];
    const generateAlreadyDone = isMeGenerateShipmentAlreadyGenerated(
        generateRes.ok,
        generateBodyText,
        meOrderId,
        genPayload,
    );

    if (!generateRes.ok && !generateAlreadyDone) {
        throw new MelhorEnvioFlowError(
            `ME generate failed (${generateRes.status}): ${generateBodyText}`,
            422,
        );
    }
    if (generateRes.ok && !genPayload) {
        throw new MelhorEnvioFlowError(
            `ME generate: JSON inválido: ${generateBodyText.slice(0, 500)}`,
            422,
        );
    }
    if (!generateAlreadyDone && (!genEntry || genEntry.status !== true)) {
        const msg = genEntry?.message ?? JSON.stringify(genEntry ?? {});
        throw new MelhorEnvioFlowError(
            `ME generate: etiqueta não gerada para ${meOrderId}: ${msg}`,
            422,
        );
    }
    if (generateAlreadyDone && (!genEntry || genEntry.status !== true)) {
        console.log(`ME generate skipped (envio ou etiqueta já gerado): ${meOrderId}`);
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

/**
 * Fluxo para "Docs": garante checkout + generate e retorna a URL da página de impressão (shipment/print).
 * A ME pode renderizar documentos adicionais nessa página (comprovantes/formulários).
 *
 * @see https://docs.melhorenvio.com.br/reference/impressao-de-etiquetas
 */
async function runMePrintPageFlow(meOrderId: string, token: string): Promise<string> {
    // Reaproveita as duas primeiras etapas do fluxo completo (checkout + generate)
    const checkoutRes = await fetch(`${ME_API_BASE}/me/shipment/checkout`, {
        method: "POST",
        headers: meHeaders(token),
        body: JSON.stringify({ orders: [meOrderId], payment_method: "wallet" }),
    });
    const checkoutBody = await checkoutRes.text().catch(() => "");
    if (!checkoutRes.ok) {
        if (isMeCheckoutAlreadyPaidOrInvalidOrders(checkoutRes.status, checkoutBody)) {
            console.log(`ME checkout skipped (envio já pago ou equivalente): ${meOrderId}`);
        } else {
            throw new MelhorEnvioFlowError(
                `ME checkout failed (${checkoutRes.status}): ${checkoutBody}`,
                422,
            );
        }
    }

    const generateRes = await fetch(`${ME_API_BASE}/me/shipment/generate`, {
        method: "POST",
        headers: meHeaders(token),
        body: JSON.stringify({ orders: [meOrderId] }),
    });
    const generateBodyText = await generateRes.text().catch(() => "");
    let genPayload: Record<string, { status?: boolean; message?: string }> | null = null;
    if (generateBodyText) {
        try {
            genPayload = JSON.parse(generateBodyText) as Record<string, { status?: boolean; message?: string }>;
        } catch {
            genPayload = null;
        }
    }
    const genEntry = genPayload?.[meOrderId];
    const generateAlreadyDone = isMeGenerateShipmentAlreadyGenerated(
        generateRes.ok,
        generateBodyText,
        meOrderId,
        genPayload,
    );
    if (!generateRes.ok && !generateAlreadyDone) {
        throw new MelhorEnvioFlowError(
            `ME generate failed (${generateRes.status}): ${generateBodyText}`,
            422,
        );
    }
    if (generateRes.ok && !genPayload) {
        throw new MelhorEnvioFlowError(
            `ME generate: JSON inválido: ${generateBodyText.slice(0, 500)}`,
            422,
        );
    }
    if (!generateAlreadyDone && (!genEntry || genEntry.status !== true)) {
        const msg = genEntry?.message ?? JSON.stringify(genEntry ?? {});
        throw new MelhorEnvioFlowError(
            `ME generate: etiqueta não gerada para ${meOrderId}: ${msg}`,
            422,
        );
    }
    if (generateAlreadyDone && (!genEntry || genEntry.status !== true)) {
        console.log(`ME generate skipped (envio ou etiqueta já gerado): ${meOrderId}`);
    }

    // Retorna o link de impressão (página) — não o PDF em S3
    return await meShipmentPrintPublic(meOrderId, token);
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

    let body: { orderId?: string; streamPdf?: boolean; printPage?: boolean; syncTracking?: boolean };
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
        .select("id, cliente_id, me_order_id, tracking_code, tracking_url, shipping_status")
        .eq("id", body.orderId)
        .maybeSingle();

    if (orderError || !order) {
        return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Autorização:
    // - imprimir (streamPdf/printPage) é restrito a staff (admin/gerente/vendedor)
    // - syncTracking pode ser feito também pelo próprio cliente (dono do pedido)
    const role = profile?.role ?? null;
    const isStaff = role === "admin" || role === "gerente" || role === "vendedor";
    const isOwner = order.cliente_id === user.id;

    if (body.syncTracking === true) {
        if (!isStaff && !isOwner) {
            return new Response(JSON.stringify({ error: "Forbidden" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
    } else {
        if (!isStaff) {
            return new Response(JSON.stringify({ error: "Forbidden" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
    }

    const meOrderId = order.me_order_id;
    if (!meOrderId) {
        return new Response(JSON.stringify({ error: "Etiqueta Melhor Envios não gerada para este pedido" }), {
            status: 422,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        if (body.syncTracking === true) {
            const details = await fetchMeOrderDetails(meOrderId, meToken);
            const trackingCode = (details.tracking ?? details.self_tracking ?? null) || null;
            const trackingUrl = details.tracking_url ?? null;

            const updatePayload: Record<string, unknown> = {
                updated_at: new Date().toISOString(),
            };
            if (trackingCode) updatePayload.tracking_code = trackingCode;
            if (trackingUrl) updatePayload.tracking_url = trackingUrl;

            if (Object.keys(updatePayload).length > 1) {
                await adminSupabase.from("orders").update(updatePayload).eq("id", body.orderId);
            }

            return new Response(JSON.stringify({ trackingCode, trackingUrl }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const pdfUrl = body.printPage === true
            ? await runMePrintPageFlow(meOrderId, meToken)
            : await runMeFullPrintFlow(meOrderId, meToken);

        /**
         * PDF em S3 (presigned) pode falhar no visualizador do Chrome (CORS / range requests).
         * Com streamPdf, o Deno faz GET ao S3 sem CORS e devolve o binário ao browser (mesma sessão autenticada).
         */
        if (body.streamPdf === true) {
            const pdfRes = await fetch(pdfUrl);
            const pdfBytes = await pdfRes.arrayBuffer().catch(() => new ArrayBuffer(0));
            if (!pdfRes.ok || pdfBytes.byteLength === 0) {
                const snippet = new TextDecoder().decode(pdfBytes.slice(0, 300));
                throw new MelhorEnvioFlowError(
                    `Falha ao baixar PDF da etiqueta (${pdfRes.status}): ${snippet || "(vazio)"}`,
                    502,
                );
            }
            return new Response(pdfBytes, {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/pdf",
                    "Content-Disposition": 'inline; filename="etiqueta.pdf"',
                },
            });
        }

        return new Response(JSON.stringify({ url: pdfUrl }), {
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

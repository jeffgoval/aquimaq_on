import { createClient } from "npm:@supabase/supabase-js@2";
import { MercadoPagoConfig, Payment } from "npm:mercadopago@2";

const VALID_STATUSES = [
    "pending",
    "approved",
    "rejected",
    "refunded",
    "cancelled",
    "in_process",
    "charged_back",
] as const;

function mapStatus(status: string | undefined): (typeof VALID_STATUSES)[number] {
    if (status && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
        return status as (typeof VALID_STATUSES)[number];
    }
    return "pending";
}

function mapOrderStatus(paymentStatus: string): string {
    switch (paymentStatus) {
        case "approved":
            return "pago";
        case "rejected":
        case "cancelled":
        case "charged_back":
        case "refunded":
            return "cancelado";
        case "in_process":
        case "pending":
        default:
            return "aguardando_pagamento";
    }
}

// ─── Melhor Envios: cria envio no carrinho após pagamento aprovado ────────────

async function createMeShipment(
    supabase: ReturnType<typeof createClient>,
    orderId: string,
): Promise<void> {
    const meToken = Deno.env.get("MELHOR_ENVIO_TOKEN");
    if (!meToken) {
        console.warn("createMeShipment: MELHOR_ENVIO_TOKEN não configurado — pulando");
        return;
    }

    // Busca pedido
    const { data: order } = await supabase
        .from("orders")
        .select("id, shipping_method, shipping_address, subtotal, total, me_order_id, cliente_id")
        .eq("id", orderId)
        .maybeSingle();

    if (!order) {
        console.warn("createMeShipment: pedido não encontrado:", orderId);
        return;
    }

    // Pula pedidos de retirada ou sem método ME
    if (!order.shipping_method || !String(order.shipping_method).startsWith("me_")) {
        console.log("createMeShipment: não é envio ME, pulando:", order.shipping_method);
        return;
    }

    // Idempotente: já tem me_order_id
    if (order.me_order_id) {
        console.log("createMeShipment: já tem me_order_id, pulando");
        return;
    }

    const serviceId = parseInt(String(order.shipping_method).replace("me_", ""), 10);
    if (isNaN(serviceId)) {
        console.warn("createMeShipment: service ID inválido:", order.shipping_method);
        return;
    }

    // Busca itens + dimensões dos produtos
    const { data: items } = await supabase
        .from("order_items")
        .select("product_name, quantity, unit_price, products(weight, width, height, length)")
        .eq("order_id", orderId);

    // Busca perfil do cliente
    const { data: profile } = await supabase
        .from("profiles")
        .select("name, email, phone, document_number, zip_code, street, number, complement, neighborhood, city, state")
        .eq("id", order.cliente_id)
        .maybeSingle();

    // Busca dados da loja (remetente)
    const { data: store } = await supabase
        .from("store_settings")
        .select("store_name, cnpj, email, phone, origin_cep, origin_street, origin_number, origin_district, origin_city, origin_state")
        .maybeSingle();

    const IS_PRODUCTION = Deno.env.get("PRODUCTION_MELHOR_ENVIO") === "true";
    const ME_API = IS_PRODUCTION
        ? "https://www.melhorenvio.com.br/api/v2"
        : "https://sandbox.melhorenvio.com.br/api/v2";

    // Endereço de destino: prioriza shipping_address do pedido, fallback para perfil
    const addr = (order.shipping_address ?? {}) as Record<string, string>;
    const destZip = (addr.zip_code ?? profile?.zip_code ?? "").replace(/\D/g, "");
    const destStreet = addr.street ?? profile?.street ?? "";
    const destNumber = addr.number ?? profile?.number ?? "S/N";
    const destComplement = addr.complement ?? profile?.complement ?? "";
    const destDistrict = addr.neighborhood ?? profile?.neighborhood ?? "";
    const destCity = addr.city ?? profile?.city ?? "";
    const destState = addr.state ?? profile?.state ?? "";

    // CEP de origem: store_settings > env var
    const originZip = ((store?.origin_cep ?? Deno.env.get("CEP_ORIGEM") ?? "")).replace(/\D/g, "");

    // Lista de produtos para o ME
    const products = (items ?? []).map((item: Record<string, unknown>) => {
        const prod = item.products as Record<string, unknown> | null;
        return {
            name: (item.product_name as string) ?? "Produto",
            quantity: item.quantity as number,
            unitary_value: Number(item.unit_price),
            weight: Number(prod?.weight ?? 0.5),
        };
    });

    if (products.length === 0) {
        console.warn("createMeShipment: nenhum item encontrado para o pedido:", orderId);
        return;
    }

    // Volume agregado: maiores dimensões + peso total
    const totalWeight = products.reduce(
        (sum: number, p: { weight: number; quantity: number }) => sum + p.weight * p.quantity,
        0,
    );
    const volumes = [{
        height: Math.max(2, ...(items ?? []).map((i: Record<string, unknown>) => {
            const p = i.products as Record<string, unknown> | null;
            return Number(p?.height ?? 10);
        })),
        width: Math.max(11, ...(items ?? []).map((i: Record<string, unknown>) => {
            const p = i.products as Record<string, unknown> | null;
            return Number(p?.width ?? 15);
        })),
        length: Math.max(16, ...(items ?? []).map((i: Record<string, unknown>) => {
            const p = i.products as Record<string, unknown> | null;
            return Number(p?.length ?? 15);
        })),
        weight: Math.max(0.1, totalWeight),
    }];

    const cartPayload = {
        service: serviceId,
        from: {
            name: store?.store_name ?? "Aquimaq",
            phone: ((store?.phone as string) ?? "").replace(/\D/g, ""),
            email: (store?.email as string) ?? "",
            document: ((store?.cnpj as string) ?? "").replace(/\D/g, ""),
            company_document: ((store?.cnpj as string) ?? "").replace(/\D/g, ""),
            address: (store?.origin_street as string) ?? "",
            number: (store?.origin_number as string) ?? "S/N",
            district: (store?.origin_district as string) ?? "",
            city: (store?.origin_city as string) ?? "",
            state_abbr: (store?.origin_state as string) ?? "",
            country_id: "BR",
            postal_code: originZip,
        },
        to: {
            name: profile?.name ?? "Cliente",
            phone: ((profile?.phone as string) ?? "").replace(/\D/g, ""),
            email: (profile?.email as string) ?? "",
            document: ((profile?.document_number as string) ?? "").replace(/\D/g, ""),
            address: destStreet,
            number: destNumber,
            complement: destComplement,
            district: destDistrict,
            city: destCity,
            state_abbr: destState,
            country_id: "BR",
            postal_code: destZip,
        },
        products,
        volumes,
        options: {
            insurance_value: Number(order.subtotal ?? order.total ?? 0),
            receipt: false,
            own_hand: false,
            non_commercial: true,
        },
    };

    const cartRes = await fetch(`${ME_API}/me/cart`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${meToken}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "AquimaqApp (suporte@aquimaq.com.br)",
        },
        body: JSON.stringify(cartPayload),
    });

    if (!cartRes.ok) {
        const errText = await cartRes.text().catch(() => "");
        console.error("createMeShipment: ME cart API error:", cartRes.status, errText);
        return;
    }

    const cartData = await cartRes.json() as Record<string, unknown>;
    const meOrderId = cartData.id as string | undefined;

    if (!meOrderId) {
        console.error("createMeShipment: ME cart API não retornou id:", JSON.stringify(cartData));
        return;
    }

    const { error: updateErr } = await supabase
        .from("orders")
        .update({ me_order_id: meOrderId, updated_at: new Date().toISOString() })
        .eq("id", orderId);

    if (updateErr) {
        console.error("createMeShipment: falha ao salvar me_order_id:", updateErr.message);
    } else {
        console.log(`createMeShipment: envio criado — order=${orderId}, me_order_id=${meOrderId}`);
    }
}

// ─── Handler principal ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
    let body: Record<string, unknown> = {};
    try {
        body = await req.json();
    } catch {
        return new Response("OK", { status: 200 });
    }

    const dataId = (body?.data as Record<string, unknown>)?.id as string | undefined;
    const type = body?.type as string | undefined;

    console.log("Webhook received:", JSON.stringify({ type, dataId }));

    if (type !== "payment" || !dataId) {
        return new Response("OK", { status: 200 });
    }

    // Signature verification — obrigatória; rejeita se secret não estiver configurado
    const webhookSecret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
    if (!webhookSecret) {
        console.error("MERCADO_PAGO_WEBHOOK_SECRET not configured");
        return new Response("Server configuration error", { status: 500 });
    }

    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    if (!xSignature || !xRequestId) {
        console.error("Missing x-signature or x-request-id header");
        return new Response("Unauthorized", { status: 401 });
    }

    const parts = xSignature.split(",");
    let ts = "";
    let hash = "";
    for (const part of parts) {
        const [key, value] = part.split("=");
        const k = key?.trim();
        const v = value?.trim();
        if (k === "ts") ts = v ?? "";
        if (k === "v1") hash = v ?? "";
    }
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(manifest)
    );
    const generatedHash = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    if (generatedHash !== hash) {
        console.error("Webhook signature mismatch");
        return new Response("Invalid Signature", { status: 401 });
    }

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
        console.error("MERCADO_PAGO_ACCESS_TOKEN not set");
        return new Response("Server configuration error", { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(client);
    let payment: {
        id?: number;
        external_reference?: string;
        status?: string;
        status_detail?: string;
        transaction_amount?: number;
        payment_type_id?: string;
        payer?: { email?: string; identification?: { number?: string } };
        installments?: number;
        date_approved?: string;
    };
    try {
        payment = await paymentClient.get({ id: dataId });
    } catch (err) {
        console.error("Failed to fetch payment from MP:", err);
        return new Response("Internal Server Error", { status: 500 });
    }

    const mpPaymentId = payment.id?.toString() ?? "";
    const orderIdUuid = payment.external_reference ?? "";
    if (!mpPaymentId || !orderIdUuid) {
        console.log("Missing payment ID or external_reference, skipping");
        return new Response("OK", { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
        console.error("Supabase env vars not set");
        return new Response("Server configuration error", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const mappedStatus = mapStatus(payment.status);

    // 1. Upsert payment record
    const { error: paymentError } = await supabase.from("payments").upsert(
        {
            order_id: orderIdUuid,
            external_id: mpPaymentId,
            external_reference: mpPaymentId,
            status: mappedStatus,
            status_detail: payment.status_detail ?? null,
            payment_type: payment.payment_type_id ?? null,
            amount: payment.transaction_amount ?? null,
            payer_email: payment.payer?.email ?? null,
            payer_document: payment.payer?.identification?.number ?? null,
            installments: payment.installments ?? null,
            paid_at: payment.date_approved ?? null,
            raw_webhook: body,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "external_reference" }
    );

    if (paymentError) {
        console.error("Webhook DB payment error:", paymentError.message);
    }

    // 2. Update order status (sempre, independente do status)
    const newOrderStatus = mapOrderStatus(mappedStatus);
    const { error: orderError } = await supabase
        .from("orders")
        .update({
            status: newOrderStatus,
            updated_at: new Date().toISOString(),
        })
        .eq("id", orderIdUuid);

    if (orderError) {
        console.error("Webhook DB order update error:", orderError.message);
    }

    // 3. Decrement stock quando aprovado — bloqueio atômico para evitar race condition.
    // UPDATE WHERE stock_decremented=false é atômico no Postgres: apenas o webhook que
    // transicionar false→true com sucesso prossegue; webhooks concorrentes leem 0 linhas e pulam.
    if (mappedStatus === "approved") {
        const { data: claimRow } = await supabase
            .from("orders")
            .update({ stock_decremented: true })
            .eq("id", orderIdUuid)
            .eq("stock_decremented", false)
            .select("id")
            .maybeSingle();

        if (claimRow) {
            // Este webhook ganhou a corrida — decrementar estoque
            const { error: stockError } = await supabase.rpc("decrement_stock_for_order", {
                p_order_id: orderIdUuid,
            });

            if (stockError) {
                console.error("Stock decrement error:", stockError.message);
                // Reverter o bloqueio para que uma nova tentativa possa decrementar
                await supabase
                    .from("orders")
                    .update({ stock_decremented: false })
                    .eq("id", orderIdUuid);
            } else {
                console.log("Stock decremented for order:", orderIdUuid);
            }
        }
        // Se claimRow for null, outro webhook já decrementou — nada a fazer

        // 4. Criar envio no Melhor Envios (não bloqueia o webhook se falhar)
        try {
            await createMeShipment(supabase, orderIdUuid);
        } catch (meErr) {
            console.error("createMeShipment falhou inesperadamente:", meErr);
        }
    }

    console.log("Webhook processed:", JSON.stringify({
        mpPaymentId,
        orderIdUuid,
        paymentStatus: mappedStatus,
        orderStatus: newOrderStatus,
    }));

    return new Response("OK", { status: 200 });
});

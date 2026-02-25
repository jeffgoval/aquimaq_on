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
            return "cancelado";
        case "in_process":
        case "pending":
        default:
            return "aguardando_pagamento";
    }
}

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

    // Signature verification
    const webhookSecret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    if (webhookSecret && xSignature && xRequestId) {
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

    // 2. Update order status
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

    console.log("Webhook processed:", JSON.stringify({
        mpPaymentId,
        orderIdUuid,
        paymentStatus: mappedStatus,
        orderStatus: newOrderStatus,
    }));

    return new Response("OK", { status: 200 });
});

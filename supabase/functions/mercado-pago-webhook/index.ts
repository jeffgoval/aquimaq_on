import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { MercadoPagoConfig, Payment } from "npm:mercadopago@2.2.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
    try {
        const url = new URL(req.url);
        const dataId = url.searchParams.get("data.id");
        const type = url.searchParams.get("type");

        // 1. Acknowledge the notification immediately (Mercado Pago requirement)
        // We do this by returning a 200/201 status after processing, or we can do it early
        // if we process asynchronously. For Edge Functions, we process and then return.

        if (type !== "payment" || !dataId) {
            return new Response("Notification received (ignoring non-payment topic)", { status: 200 });
        }

        // 2. Validate Origin (x-signature)
        const xSignature = req.headers.get("x-signature");
        const xRequestId = req.headers.get("x-request-id");
        const webhookSecret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");

        if (webhookSecret && xSignature && xRequestId) {
            const parts = xSignature.split(",");
            let ts = "";
            let hash = "";

            parts.forEach(part => {
                const [key, value] = part.split("=");
                if (key.trim() === "ts") ts = value.trim();
                if (key.trim() === "v1") hash = value.trim();
            });

            const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

            // HMAC SHA256 validation
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
                .map(b => b.toString(16).padStart(2, "0"))
                .join("");

            if (generatedHash !== hash) {
                console.error("Invalid Webhook Signature");
                return new Response("Invalid Signature", { status: 401 });
            }
        }

        // 3. Fetch Payment Details from Mercado Pago
        const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
        if (!accessToken) {
            console.error("MERCADO_PAGO_ACCESS_TOKEN is not set");
            return new Response("Server configuration error", { status: 500 });
        }
        const client = new MercadoPagoConfig({ accessToken });
        const paymentClient = new Payment(client);

        const payment = await paymentClient.get({ id: dataId });

        // 4. Update Database (schema existente: order_id uuid FK orders, external_reference unique = id MP)
        const mpPaymentId = payment.id?.toString() ?? "";
        const orderIdUuid = payment.external_reference ?? "";
        if (!mpPaymentId) {
            console.error("Payment sem id:", dataId);
            return new Response("OK", { status: 200 });
        }
        const validStatuses = ["pending", "approved", "rejected", "refunded", "cancelled", "in_process", "charged_back"];
        const status = payment.status && validStatuses.includes(payment.status) ? payment.status : "pending";
        const { error } = await supabase
            .from("payments")
            .upsert({
                order_id: orderIdUuid,
                external_id: mpPaymentId,
                external_reference: mpPaymentId,
                status,
                amount: payment.transaction_amount ?? null,
                updated_at: new Date().toISOString(),
            }, { onConflict: "external_reference" });

        if (error) {
            console.error("Database error:", error);
            // Return 200 anyway so MP stops retrying, but log the error
        }

        return new Response("OK", { status: 200 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("Webhook processing error:", msg);
        return new Response("Internal Server Error", { status: 500 });
    }
});

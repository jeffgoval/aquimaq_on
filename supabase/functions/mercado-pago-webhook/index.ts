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

Deno.serve(async (req) => {
  // MP sends webhook notifications as JSON body (current format)
  // Legacy IPN used query params — this function handles the modern webhook format
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // If body parsing fails, return 200 to avoid MP retries for malformed requests
    return new Response("OK", { status: 200 });
  }

  const dataId = (body?.data as Record<string, unknown>)?.id as string | undefined;
  const type = body?.type as string | undefined;

  if (type !== "payment" || !dataId) {
    return new Response("OK", { status: 200 });
  }

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
    // Template uses data.id from the JSON body, not query params
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
      return new Response("Invalid Signature", { status: 401 });
    }
  }

  const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!accessToken) {
    return new Response("Server configuration error", { status: 500 });
  }

  const client = new MercadoPagoConfig({ accessToken });
  const paymentClient = new Payment(client);
  let payment: { id?: number; external_reference?: string; status?: string; transaction_amount?: number };
  try {
    payment = await paymentClient.get({ id: dataId });
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }

  const mpPaymentId = payment.id?.toString() ?? "";
  const orderIdUuid = payment.external_reference ?? "";
  if (!mpPaymentId) {
    return new Response("OK", { status: 200 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Server configuration error", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await supabase.from("payments").upsert(
    {
      order_id: orderIdUuid,
      external_id: mpPaymentId,
      external_reference: mpPaymentId,
      status: mapStatus(payment.status),
      amount: payment.transaction_amount ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "external_reference" }
  );

  if (error) {
    console.error("Webhook DB error:", error.message);
  }

  return new Response("OK", { status: 200 });
});

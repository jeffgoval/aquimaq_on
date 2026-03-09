import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MercadoPagoConfig, Preference } from "npm:mercadopago@2.2.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // CORS Handling
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
        if (!accessToken) {
            throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not set");
        }

        const body = await req.json();
        const { order_id, items, payer, siteUrl: siteUrlFromBody } = body;

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("items é obrigatório e deve ser um array não vazio");
        }
        if (!order_id || typeof order_id !== "string") {
            throw new Error("order_id (uuid do pedido) é obrigatório");
        }

        const origin = req.headers.get("origin");
        const baseUrl = origin ?? siteUrlFromBody ?? "";
        const back_urls = {
            success: `${baseUrl}/pagamento/sucesso`,
            failure: `${baseUrl}/pagamento/falha`,
            pending: `${baseUrl}/pagamento/pendente`,
        };

        // #region agent log
        console.log(JSON.stringify({
            hypothesisId: "H1-H2",
            origin,
            siteUrlFromBody: siteUrlFromBody ?? null,
            back_urls,
            itemsCount: items?.length,
            order_id,
        }));
        // #endregion

        // Initialize Mercado Pago
        const client = new MercadoPagoConfig({ accessToken });
        const preference = new Preference(client);

        // Create Preference
        const response = await preference.create({
            body: {
                items: items,
                payer: payer || {},
                external_reference: String(order_id),
                statement_descriptor: "AQUIMAQ",
                back_urls,
                auto_return: "approved",
                notification_url: `https://bzicdqrbqykypzesxayw.supabase.co/functions/v1/mercado-pago-webhook`,
            },
        });

        // Em modo teste (credenciais de teste), a API devolve sandbox_init_point; use-o para o redirect.
        const checkoutUrl = response.sandbox_init_point ?? response.init_point;
        if (!checkoutUrl) {
            throw new Error("Mercado Pago não devolveu URL de checkout (init_point nem sandbox_init_point). Verifique credenciais (teste vs produção).");
        }

        return new Response(JSON.stringify({
            id: response.id,
            checkout_url: checkoutUrl,
            debug: { origin, siteUrlFromBody: siteUrlFromBody ?? null, back_urls },
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        // #region agent log
        console.log(JSON.stringify({ hypothesisId: "H2", error: msg }));
        // #endregion
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

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

        const { order_id, items, payer } = await req.json();

        // Initialize Mercado Pago
        const client = new MercadoPagoConfig({ accessToken });
        const preference = new Preference(client);

        // Create Preference
        const response = await preference.create({
            body: {
                items: items || [
                    {
                        id: order_id,
                        title: `Pedido #${order_id.slice(0, 8)}`,
                        quantity: 1,
                        unit_price: 100.0, // Placeholder, usually you'd fetch this from DB using order_id
                    },
                ],
                payer: payer || {},
                external_reference: order_id,
                back_urls: {
                    success: `${req.headers.get("origin")}/pagamento/sucesso`,
                    failure: `${req.headers.get("origin")}/pagamento/falha`,
                    pending: `${req.headers.get("origin")}/pagamento/pendente`,
                },
                auto_return: "approved",
                notification_url: `https://bzicdqrbqykypzesxayw.supabase.co/functions/v1/mercado-pago-webhook`,
            },
        });

        return new Response(JSON.stringify({
            id: response.id,
            checkout_url: response.init_point
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

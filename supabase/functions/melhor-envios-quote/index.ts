import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CartItem {
  id?: string;
  weight: number;
  width: number;
  height: number;
  length: number;
  quantity: number;
  insurance_value?: number;
}

interface QuoteRequest {
  destination_cep: string;
  items: CartItem[];
  insurance_value?: number;
}

// Handler for the Edge Function
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // We expect the payload from the store
    const payload = (await req.json()) as QuoteRequest;

    if (!payload.destination_cep || !payload.items || payload.items.length === 0) {
      return new Response(JSON.stringify({ error: "Parâmetros inválidos (CEP de destino ou itens faltantes)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { destination_cep, items } = payload;

    // Check environment variables
    const MELHOR_ENVIO_TOKEN = Deno.env.get("MELHOR_ENVIO_TOKEN");
    const CEP_ORIGEM = Deno.env.get("CEP_ORIGEM") || "01001000"; // Fallback origin if missing
    // We use Sandbox API for default, or Production if env specified
    const IS_PRODUCTION = Deno.env.get("PRODUCTION_MELHOR_ENVIO") === "true";
    const API_URL = IS_PRODUCTION
      ? "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate"
      : "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate";

    if (!MELHOR_ENVIO_TOKEN) {
      console.error("MELHOR_ENVIO_TOKEN não configurado no Supabase.");
      return new Response(JSON.stringify({ error: "Serviço de frete indisponível (Token não configurado)" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map payload items to format expected by Melhor Envio API
    // Official spec: products[].id is required
    const volumes = items.map((item, idx) => ({
      id: item.id ?? String(idx + 1),  // required by API spec
      weight: item.weight,
      width: item.width,
      height: item.height,
      length: item.length,
      quantity: item.quantity,
    }));

    // Total insurance value (sum of product values for correct rate calculation)
    const totalInsuranceValue = payload.insurance_value ?? 0;

    const calculatePayload = {
      from: {
        postal_code: CEP_ORIGEM,
      },
      to: {
        postal_code: destination_cep,
      },
      products: volumes,
      options: {
        insurance_value: totalInsuranceValue,
        receipt: false,
        own_hand: false,
      },
    };

    console.log(`Calculating shipping from ${CEP_ORIGEM} to ${destination_cep}`);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MELHOR_ENVIO_TOKEN}`,
        // User-Agent is required by Melhor Envio API (docs.melhorenvio.com.br)
        "User-Agent": "Aquimaq E-commerce (jeff.goval@gmail.com)",
      },
      body: JSON.stringify(calculatePayload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Error from Melhor Envio (${res.status}):`, errorText);
      return new Response(JSON.stringify({ error: "Erro ao consultar a API do Melhor Envios" }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();

    // Transform the response array to our expected ShippingOption interface
    // Note: The structure depends on the API answer. Usually it returns an array of objects.
    const shippingOptions = data
      .filter((option: any) => !option.error) // Remove options with errors (e.g., zip code not served)
      .map((option: any) => ({
        id: `me_${option.id}`,
        carrier: option.company?.name || "Transportadora",
        service: option.name || "Padrão",
        price: parseFloat(option.custom_price || option.price),
        estimatedDays: option.custom_delivery_time || option.delivery_time,
      }));

    return new Response(JSON.stringify({ options: shippingOptions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Internal Server Error calculating shipping:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

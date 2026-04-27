import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const buildAllowedOrigins = (): string[] => {
  const configuredOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "https://aquimaq.com.br";

  try {
    const url = new URL(configuredOrigin);
    const hostname = url.hostname.replace(/^www\./, "");
    return Array.from(new Set([
      configuredOrigin,
      `${url.protocol}//${hostname}`,
      `${url.protocol}//www.${hostname}`,
    ]));
  } catch {
    return [configuredOrigin, "https://aquimaq.com.br", "https://www.aquimaq.com.br"];
  }
};

/** Retorna o origin permitido: domínio de produção (com e sem www) ou localhost em desenvolvimento. */
function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get("Origin") ?? "";
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const allowedOrigins = buildAllowedOrigins();

  if (isLocalhost || allowedOrigins.includes(origin)) {
    return origin;
  }

  return allowedOrigins[0] ?? "https://aquimaq.com.br";
}

interface CartItem {
  id?: string;
  weight: number;
  width: number;
  height: number;
  length: number;
  quantity: number;
  insurance_value: number;
}

interface QuoteRequest {
  destination_cep: string;
  items: CartItem[];
  insurance_value?: number;
}

interface MelhorEnvioOption {
  id?: string | number;
  name?: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  custom_delivery_time?: number;
  error?: string;
  company?: {
    name?: string;
  } | null;
}

const normalizeCarrierError = (error: string): string => {
  const trimmed = error.trim();

  if (/zip\s*code\s*not\s*served|postal\s*code\s*not\s*served|cep.+nao.+atendido/i.test(trimmed)) {
    return "O CEP informado nao e atendido pelas transportadoras disponiveis.";
  }

  if (/weight|width|height|length|dimension|package|volume/i.test(trimmed)) {
    return "Os produtos do carrinho precisam de peso e dimensoes validos para cotacao.";
  }

  if (/origin|from\.postal_code|sender|source/i.test(trimmed)) {
    return "O CEP de origem da loja nao esta configurado corretamente.";
  }

  return trimmed;
};

const summarizeCarrierErrors = (errors: string[]): string => {
  if (errors.length === 0) {
    return "Nenhuma transportadora retornou frete para este CEP.";
  }

  if (errors.length === 1) {
    return errors[0];
  }

  return `Nenhuma transportadora retornou frete para este CEP. Motivos: ${errors.slice(0, 2).join(" | ")}`;
};

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };

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

    const MELHOR_ENVIO_TOKEN = Deno.env.get("MELHOR_ENVIO_TOKEN");
    if (!MELHOR_ENVIO_TOKEN) {
      console.error("MELHOR_ENVIO_TOKEN não configurado no Supabase.");
      return new Response(JSON.stringify({ error: "Serviço de frete indisponível (Token não configurado)" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CEP de origem: store_settings (igual ao createMeShipment) > CEP_ORIGEM env > fallback
    let CEP_ORIGEM: string | null = null;
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { data: store } = await supabase
        .from("store_settings")
        .select("origin_cep")
        .limit(1)
        .maybeSingle();
      const originCep = (store as { origin_cep?: string } | null)?.origin_cep?.replace(/\D/g, "");
      if (originCep && originCep.length === 8) CEP_ORIGEM = originCep;
    }
    if (!CEP_ORIGEM) {
      const envCep = Deno.env.get("CEP_ORIGEM")?.replace(/\D/g, "");
      if (envCep && envCep.length === 8) CEP_ORIGEM = envCep;
    }
    if (!CEP_ORIGEM) {
      console.error("CEP de origem nao configurado em store_settings.origin_cep nem em CEP_ORIGEM.");
      return new Response(JSON.stringify({ error: "CEP de origem da loja nao configurado." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // We use Sandbox API for default, or Production if env specified
    const IS_PRODUCTION = Deno.env.get("PRODUCTION_MELHOR_ENVIO") === "true";
    const API_URL = IS_PRODUCTION
      ? "https://www.melhorenvio.com.br/api/v2/me/shipment/calculate"
      : "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate";

    // Map payload items to format expected by Melhor Envio API
    // Official spec: products[].id is required
    const volumes = items.map((item, idx) => ({
      id: item.id ?? String(idx + 1),
      weight: item.weight,
      width: item.width,
      height: item.height,
      length: item.length,
      quantity: item.quantity,
      insurance_value: item.insurance_value ?? 0,
    }));

    const calculatePayload = {
      from: { postal_code: CEP_ORIGEM },
      to: { postal_code: destination_cep },
      products: volumes,
      options: {
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
    const options = Array.isArray(data) ? (data as MelhorEnvioOption[]) : [];

    // Transform the response array to our expected ShippingOption interface
    // Note: The structure depends on the API answer. Usually it returns an array of objects.
    const shippingOptions = options
      .filter((option) => !option.error)
      .map((option) => ({
        id: `me_${option.id}`,
        carrier: option.company?.name || "Transportadora",
        service: option.name || "Padrão",
        price: parseFloat(option.custom_price || option.price),
        estimatedDays: option.custom_delivery_time || option.delivery_time,
      }));

    const carrierErrors = Array.from(
      new Set(
        options
          .map((option) => option.error)
          .filter((error): error is string => Boolean(error))
          .map(normalizeCarrierError)
      )
    );

    if (shippingOptions.length === 0 && carrierErrors.length > 0) {
      console.warn("Nenhuma cotacao valida retornada pelo Melhor Envio:", carrierErrors);
      return new Response(JSON.stringify({
        options: [],
        error: summarizeCarrierErrors(carrierErrors),
        carrierErrors,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ options: shippingOptions, carrierErrors }), {
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

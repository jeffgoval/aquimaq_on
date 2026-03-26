import { createClient } from "npm:@supabase/supabase-js@2";
import { MercadoPagoConfig, Preference } from "npm:mercadopago@2";

/** Retorna o origin permitido: domínio de produção ou localhost em desenvolvimento. */
function getAllowedOrigin(req: Request): string {
    const origin = req.headers.get("Origin") ?? "";
    const prodOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "https://aquimaq.com.br";
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    return (isLocalhost || origin === prodOrigin) ? origin : prodOrigin;
}

interface OrderPayload {
    shipping_cost: number;
    shipping_method?: string | null;
    shipping_method_label?: string | null;
    coupon_code?: string | null;
    scheduled_delivery_date?: string | null;
    scheduled_delivery_notes?: string | null;
    shipping_address?: {
        street?: string | null;
        number?: string | null;
        neighborhood?: string | null;
        city?: string | null;
        state?: string | null;
        zip_code?: string | null;
    } | null;
}

interface MPItem {
    id?: string;
    title: string;
    description?: string;
    category_id?: string;
    quantity: number;
    unit_price: number;
    currency_id?: string;
}

interface ProductRow {
    id: string;
    name: string;
    stock: number;
    price: number;
    wholesale_min_amount: number | null;
    wholesale_discount_percent: number | null;
}

/** Aplica desconto de atacado (mesma lógica de src/utils/price.ts). */
function calcServerUnitPrice(product: ProductRow, quantity: number): number {
    if (
        product.wholesale_min_amount != null &&
        product.price * quantity >= product.wholesale_min_amount &&
        product.wholesale_discount_percent != null
    ) {
        return product.price * (1 - product.wholesale_discount_percent / 100);
    }
    return product.price;
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

/** Payer opcional: melhora taxa de aprovação (checklist MP). Em sandbox pode causar "uma das partes é de teste". */
interface PayerPayload {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
}

interface CheckoutBody {
    order: OrderPayload;
    items: MPItem[];
    back_url_base: string;
    payer?: PayerPayload | null;
}

function parseBody(body: unknown): CheckoutBody | null {
    if (!body || typeof body !== "object") return null;
    const b = body as Record<string, unknown>;
    if (!b.order || typeof b.order !== "object") return null;
    if (!Array.isArray(b.items) || b.items.length === 0) return null;
    const order = b.order as OrderPayload;
    if (typeof order.shipping_cost !== "number" || order.shipping_cost < 0) return null;
    if (typeof b.back_url_base !== "string" || !b.back_url_base.trim()) return null;
    // Normalise coupon_code (allow string or null/undefined)
    if (order.coupon_code !== undefined && order.coupon_code !== null && typeof order.coupon_code !== "string") {
        order.coupon_code = null;
    }
    const base = (b.back_url_base as string).trim().replace(/\/$/, "");
    let payer: PayerPayload | undefined;
    if (b.payer && typeof b.payer === "object") {
        const p = b.payer as Record<string, unknown>;
        payer = {
            email: typeof p.email === "string" ? p.email : null,
            first_name: typeof p.first_name === "string" ? p.first_name : null,
            last_name: typeof p.last_name === "string" ? p.last_name : null,
            phone: typeof p.phone === "string" ? p.phone : null,
        };
    }
    return {
        order,
        items: b.items as MPItem[],
        back_url_base: base,
        payer,
    };
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
        return new Response(JSON.stringify({ error: "Server configuration error" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Authenticate user via the Authorization header (verify_jwt=false, auth handled here)
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
        return new Response(JSON.stringify({ error: "Você precisa estar logado para finalizar a compra." }), {
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    let body: unknown;
    try { body = await req.json(); }
    catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const payload = parseBody(body);
    if (!payload) {
        return new Response(
            JSON.stringify({ error: "Body must include order, items, and back_url_base" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
        return new Response(JSON.stringify({ error: "Payment provider not configured" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
        return new Response(JSON.stringify({ error: "Server configuration error" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Separar itens reais do item de frete
    const realItems = payload.items.filter((item) => item.id !== "shipping");
    const shippingItem = payload.items.find((item) => item.id === "shipping");

    // 2. Buscar produtos do banco (estoque + preços reais) ANTES de criar o pedido
    const productIds = realItems.map((i) => i.id).filter(Boolean) as string[];
    if (productIds.length === 0) {
        return new Response(JSON.stringify({ error: "Nenhum produto válido no carrinho." }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const { data: productRows, error: productFetchError } = await supabaseAdmin
        .from("products")
        .select("id, name, stock, price, wholesale_min_amount, wholesale_discount_percent")
        .in("id", productIds);

    if (productFetchError || !productRows) {
        return new Response(JSON.stringify({ error: "Erro ao verificar produtos." }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // 3. Validar estoque e calcular preços server-side
    for (const item of realItems) {
        if (!item.id) continue;
        const product = productRows.find((p: ProductRow) => p.id === item.id);
        if (!product) {
            return new Response(
                JSON.stringify({ error: `Produto não encontrado: ${item.id}` }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }
        if ((product as ProductRow).stock < item.quantity) {
            return new Response(
                JSON.stringify({
                    error: `Estoque insuficiente para "${(product as ProductRow).name}". Disponível: ${(product as ProductRow).stock}.`,
                }),
                { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }
    }

    // 4. Calcular totais com preços reais do banco
    const serverItems = realItems.map((item) => {
        const product = productRows.find((p: ProductRow) => p.id === item.id) as ProductRow;
        const unitPrice = round2(calcServerUnitPrice(product, item.quantity));
        return {
            product_id: item.id!,
            product_name: product.name,
            quantity: item.quantity,
            unit_price: unitPrice,
            // Para o MP: mantém title/description/category do cliente
            title: item.title,
            description: item.description,
            category_id: item.category_id,
        };
    });

    const serverSubtotal = round2(
        serverItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
    );
    const shippingCost = round2(Math.max(0, payload.order.shipping_cost));

    // 4b. Validate coupon server-side (anti-fraud)
    let couponRow: Record<string, unknown> | null = null;
    let discountAmount = 0;
    if (payload.order.coupon_code) {
        const { data: couponData } = await supabaseAdmin
            .from("coupons")
            .select("*")
            .eq("code", payload.order.coupon_code.trim().toUpperCase())
            .eq("active", true)
            .single();
        if (
            couponData &&
            (!couponData.expiration_date || new Date(couponData.expiration_date as string) > new Date()) &&
            (couponData.max_uses === null || (couponData.used_count as number) < (couponData.max_uses as number)) &&
            serverSubtotal >= (couponData.min_purchase_amount as number)
        ) {
            couponRow = couponData as Record<string, unknown>;
            discountAmount = couponData.discount_type === "percentage"
                ? round2(serverSubtotal * (couponData.discount_value as number) / 100)
                : Math.min(couponData.discount_value as number, serverSubtotal);
        }
    }

    const serverTotal = round2(Math.max(0, serverSubtotal + shippingCost - discountAmount));

    // 5. Criar pedido com valores server-side
    const { data: orderRow, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
            cliente_id: user.id,
            status: "aguardando_pagamento",
            subtotal: serverSubtotal,
            shipping_cost: shippingCost,
            discount_amount: discountAmount,
            total: serverTotal,
            coupon_id: couponRow ? (couponRow.id as string) : null,
            shipping_method: payload.order.shipping_method ?? null,
            shipping_method_label: payload.order.shipping_method_label ?? null,
            shipping_address: payload.order.shipping_address ?? null,
            scheduled_delivery_date: payload.order.scheduled_delivery_date ?? null,
            scheduled_delivery_notes: payload.order.scheduled_delivery_notes ?? null,
            payment_method: "mercado_pago",
        })
        .select("id")
        .single();

    if (orderError || !orderRow?.id) {
        return new Response(
            JSON.stringify({ error: orderError?.message ?? "Failed to create order" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // 6. Inserir order_items com preços server-side
    const orderItems = serverItems.map((item) => ({
        order_id: orderRow.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
    }));
    if (orderItems.length > 0) {
        await supabaseAdmin.from("order_items").insert(orderItems);
    }

    // 6b. Incrementar used_count do cupom (best-effort)
    if (couponRow) {
        await supabaseAdmin
            .from("coupons")
            .update({ used_count: (couponRow.used_count as number) + 1 })
            .eq("id", couponRow.id as string);
    }

    // 7. Read payment settings from store_settings
    const { data: storeRow } = await supabaseAdmin
        .from("store_settings")
        .select("max_installments, accepted_payment_types")
        .maybeSingle();

    const maxInstallments = (storeRow as any)?.max_installments ?? 12;
    const acceptedTypes: string[] = (storeRow as any)?.accepted_payment_types ?? ["credit_card", "debit_card", "bank_transfer", "ticket"];
    const allTypes = ["credit_card", "debit_card", "bank_transfer", "ticket"];
    const excludedPaymentTypes = allTypes
        .filter((t) => !acceptedTypes.includes(t))
        .map((t) => ({ id: t }));

    // 7b. Create Mercado Pago preference
    const backUrls = {
        success: `${payload.back_url_base}/pagamento/sucesso`,
        failure: `${payload.back_url_base}/pagamento/falha`,
        pending: `${payload.back_url_base}/pagamento/pendente`,
    };

    const webhookUrl = `${supabaseUrl}/functions/v1/mercado-pago-webhook`;
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    // Montar itens para o MP com preços server-side
    const itemsWithCurrency = [];
    if (discountAmount > 0 && couponRow) {
        itemsWithCurrency.push({
            id: "order_items",
            title: `Pedido ${orderRow.id} (Desconto: ${couponRow.code})`,
            description: `Produtos do pedido ${orderRow.id} com desconto aplicado`,
            category_id: "others",
            quantity: 1,
            unit_price: round2(serverSubtotal - discountAmount),
            currency_id: "BRL",
        });
    } else {
        itemsWithCurrency.push(...serverItems.map((item) => ({
            id: item.product_id,
            title: item.title,
            description: (item.description ?? item.title)?.slice(0, 256),
            category_id: item.category_id ?? "others",
            quantity: item.quantity,
            unit_price: item.unit_price,
            currency_id: "BRL",
        })));
    }

    if (shippingCost > 0 && shippingItem) {
        itemsWithCurrency.push({
            id: "shipping",
            title: shippingItem.title,
            description: shippingItem.description?.slice(0, 256),
            category_id: "others",
            quantity: 1,
            unit_price: shippingCost,
            currency_id: "BRL",
        });
    }

    const payer =
        payload.payer?.email?.trim() || payload.payer?.first_name?.trim()
            ? {
                ...(payload.payer.email?.trim() && { email: payload.payer.email.trim() }),
                ...(payload.payer.first_name?.trim() && { first_name: payload.payer.first_name.trim().slice(0, 80) }),
                ...(payload.payer.last_name?.trim() && { last_name: payload.payer.last_name.trim().slice(0, 80) }),
                ...(payload.payer.phone?.trim() && { phone: { number: payload.payer.phone.trim().replace(/\D/g, "").slice(0, 15) } }),
            }
            : undefined;

    let mpResponse: { id?: string; init_point?: string; sandbox_init_point?: string };
    try {
        mpResponse = await preference.create({
            body: {
                items: itemsWithCurrency,
                external_reference: orderRow.id,
                statement_descriptor: "AQUIMAQ",
                back_urls: backUrls,
                notification_url: webhookUrl,
                payment_methods: {
                    installments: maxInstallments,
                    ...(excludedPaymentTypes.length > 0 && { excluded_payment_types: excludedPaymentTypes }),
                },
                ...(Object.keys(payer ?? {}).length > 0 && { payer }),
                auto_return: "approved",
            },
        });
    } catch (err: any) {
        const errorDetails = err?.cause ?? err?.message ?? JSON.stringify(err);
        return new Response(
            JSON.stringify({ error: "Failed to create payment preference", details: errorDetails }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Use init_point (production checkout) — avoids ERR_TOO_MANY_REDIRECTS
    const checkoutUrl = mpResponse.init_point ?? mpResponse.sandbox_init_point;
    if (!checkoutUrl) {
        return new Response(
            JSON.stringify({ error: "Payment provider did not return checkout URL" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // 8. Create initial payment record with server-side total
    await supabaseAdmin.from("payments").insert({
        order_id: orderRow.id,
        mp_preference_id: mpResponse.id ?? null,
        mp_checkout_url: checkoutUrl,
        status: "pending",
        amount: serverTotal,
    });

    return new Response(
        JSON.stringify({ order_id: orderRow.id, checkout_url: checkoutUrl }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
});

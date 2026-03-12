/**
 * detect-abandoned-carts — Detecta carrinhos abandonados e pedidos aguardando pagamento
 * e insere eventos na fila n8n_webhook_logs para o n8n processar.
 *
 * Deve ser chamada pelo n8n em schedule (ex: a cada 30 minutos).
 * Requer autenticação via service_role key no header Authorization.
 *
 * Retorna:
 *   { abandoned_carts: number, pending_orders: number }
 *
 * Eventos gerados em n8n_webhook_logs:
 *   cart.abandoned  — carrinho com itens, sem atividade por > ABANDON_HOURS h, ainda não notificado
 *   order.follow_up — pedido aguardando_pagamento por > FOLLOW_UP_HOURS h, sem follow-up
 *
 * Payload cart.abandoned:
 *   { user_id, phone, name, email, items, subtotal, item_count, cart_updated_at }
 *
 * Payload order.follow_up:
 *   { order_id, user_id, phone, name, email, total, created_at }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ABANDON_HOURS = 2;     // horas sem atividade para considerar carrinho abandonado
const FOLLOW_UP_HOURS = 4;   // horas sem pagamento para follow-up de pedido
const RENOTIFY_DAYS = 2;     // dias antes de renotificar o mesmo carrinho abandonado

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
    }

    const supabaseUrl     = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
        return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
    }

    // Verifica que a chamada vem com a service role key
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const envAnon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const legacySrv = Deno.env.get("LEGACY_SERVICE_ROLE_KEY") || "";
    
    if (token !== serviceRoleKey && token !== legacySrv && token !== envAnon) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    let abandonedCount = 0;
    let followUpCount = 0;

    // ── 1. Carrinhos abandonados ───────────────────────────────────────────────
    const abandonCutoff = new Date(Date.now() - ABANDON_HOURS * 60 * 60 * 1000).toISOString();
    const renotifyCutoff = new Date(Date.now() - RENOTIFY_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: abandonedCarts, error: cartErr } = await supabase
        .from("cart_sessions")
        .select("user_id, items, subtotal, item_count, updated_at")
        .gt("item_count", 0)
        .lt("updated_at", abandonCutoff)
        .or(`abandonment_notified_at.is.null,abandonment_notified_at.lt.${renotifyCutoff}`);

    if (cartErr) {
        console.error("Error fetching cart_sessions:", cartErr.message);
    } else if (abandonedCarts && abandonedCarts.length > 0) {
        // Buscar perfis dos clientes para obter telefone/email
        const userIds = abandonedCarts.map((c) => c.user_id);
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name, phone, email")
            .in("id", userIds);

        const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

        for (const cart of abandonedCarts) {
            const profile = profileMap[cart.user_id];
            if (!profile?.phone) continue; // sem telefone, não há como notificar via WhatsApp

            const eventPayload = {
                user_id: cart.user_id,
                phone: profile.phone,
                name: profile.name ?? "",
                email: profile.email ?? "",
                items: cart.items,
                subtotal: cart.subtotal,
                item_count: cart.item_count,
                cart_updated_at: cart.updated_at,
            };

            await supabase.from("n8n_webhook_logs").insert({
                event_type: "cart.abandoned",
                payload: eventPayload,
                status: "pending",
            });

            // Marca notificação para evitar reenvio
            await supabase
                .from("cart_sessions")
                .update({ abandonment_notified_at: new Date().toISOString() })
                .eq("user_id", cart.user_id);

            abandonedCount++;
        }
    }

    // ── 2. Follow-up de pedidos aguardando pagamento ───────────────────────────
    const followUpCutoff = new Date(Date.now() - FOLLOW_UP_HOURS * 60 * 60 * 1000).toISOString();

    // Verificar pedidos que já tiveram follow-up (evita duplicatas na fila)
    const { data: alreadyQueued } = await supabase
        .from("n8n_webhook_logs")
        .select("payload->order_id")
        .eq("event_type", "order.follow_up")
        .gte("created_at", new Date(Date.now() - RENOTIFY_DAYS * 24 * 60 * 60 * 1000).toISOString());

    const alreadyQueuedIds = new Set(
        (alreadyQueued ?? []).map((r) => r["?column?"]).filter(Boolean)
    );

    const { data: pendingOrders, error: ordersErr } = await supabase
        .from("orders")
        .select("id, cliente_id, total, created_at")
        .eq("status", "aguardando_pagamento")
        .lt("created_at", followUpCutoff);

    if (ordersErr) {
        console.error("Error fetching pending orders:", ordersErr.message);
    } else if (pendingOrders && pendingOrders.length > 0) {
        const orderUserIds = [...new Set(pendingOrders.map((o) => o.cliente_id))];
        const { data: orderProfiles } = await supabase
            .from("profiles")
            .select("id, name, phone, email")
            .in("id", orderUserIds);

        const orderProfileMap = Object.fromEntries((orderProfiles ?? []).map((p) => [p.id, p]));

        for (const order of pendingOrders) {
            if (alreadyQueuedIds.has(order.id)) continue;

            const profile = orderProfileMap[order.cliente_id];
            if (!profile?.phone) continue;

            await supabase.from("n8n_webhook_logs").insert({
                event_type: "order.follow_up",
                payload: {
                    order_id: order.id,
                    user_id: order.cliente_id,
                    phone: profile.phone,
                    name: profile.name ?? "",
                    email: profile.email ?? "",
                    total: order.total,
                    created_at: order.created_at,
                },
                status: "pending",
            });

            followUpCount++;
        }
    }

    return new Response(
        JSON.stringify({ ok: true, abandoned_carts: abandonedCount, pending_orders: followUpCount }),
        { status: 200, headers: { "Content-Type": "application/json" } }
    );
});

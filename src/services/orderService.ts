import { supabase } from '@/services/supabase';
import type { Order, OrderStatus } from '@/types';

interface OrderRow {
    id: string;
    cliente_id: string;
    status: string;
    subtotal: number;
    shipping_cost: number;
    total: number;
    shipping_method: string | null;
    payment_method: string | null;
    tracking_code: string | null;
    created_at: string;
    order_items: Array<{
        product_id: string | null;
        product_name: string | null;
        quantity: number;
        unit_price: number;
    }>;
}

/**
 * Fetches all orders for a given client (user) ID, including their items.
 */
export async function fetchOrders(clientId: string): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      id,
      cliente_id,
      status,
      subtotal,
      shipping_cost,
      total,
      shipping_method,
      payment_method,
      tracking_code,
      created_at,
      order_items (
        product_id,
        product_name,
        quantity,
        unit_price
      )
    `)
        .eq('cliente_id', clientId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('fetchOrders error:', error);
        throw new Error('Erro ao buscar pedidos.');
    }

    return (data as unknown as OrderRow[]).map((row): Order => ({
        id: row.id,
        clientId: row.cliente_id,
        items: (row.order_items || []).map((item) => ({
            productId: item.product_id ?? '',
            productName: item.product_name ?? '',
            unitPrice: item.unit_price,
            quantity: item.quantity,
        })),
        subtotal: Number(row.subtotal),
        shippingCost: Number(row.shipping_cost),
        total: Number(row.total),
        status: row.status as OrderStatus,
        createdAt: row.created_at,
        shippingMethod: row.shipping_method ?? undefined,
        paymentMethod: row.payment_method ?? undefined,
        trackingCode: row.tracking_code ?? undefined,
    }));
}

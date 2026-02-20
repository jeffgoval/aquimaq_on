import { supabase } from './supabase';
import { CartItem, Order, OrderStatus, ShippingOption, Cliente } from '@/types';

type Address = NonNullable<Cliente['address']>;

/**
 * Cria pedido no Supabase.
 * O clientId deve ser o id do utilizador autenticado (ex.: useAuth().user?.id).
 */
export const createOrder = async (
    clientId: string,
    cart: CartItem[],
    shippingOption: ShippingOption,
    shippingAddress: Address
): Promise<Order | null> => {

    // 1. Calculate totals (Server-side validation ideally, but client-side here for MVP)
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingCost = shippingOption.price;
    const total = subtotal + shippingCost;

    // 2. Call RPC to create order and items atomically
    const rpcItems = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price
    }));

    const { data: orderResponse, error: rpcError } = await supabase.rpc('create_order', {
        p_cliente_id: clientId,
        p_items: rpcItems,
        p_shipping_cost: shippingCost,
        p_subtotal: subtotal,
        p_total: total,
        p_shipping_method: shippingOption.service,
        p_shipping_address: shippingAddress,
        p_payment_method: 'a_combinar',
        p_payment_details: {
            carrier: shippingOption.carrier,
            service: shippingOption.service,
            estimated_days: shippingOption.estimatedDays
        }
    });

    if (rpcError) {
        console.error('Error creating order via RPC:', rpcError);
        throw new Error('Erro ao criar pedido: ' + rpcError.message);
    }

    const newOrder = orderResponse as any; // RPC returns JSONB

    // 4. Return mapped order object for UI
    return {
        id: newOrder.id,
        clientId: newOrder.cliente_id ?? clientId,
        status: (newOrder.status as OrderStatus) || OrderStatus.WAITING_PAYMENT,
        createdAt: (newOrder.created_at as string) ?? new Date().toISOString(),
        subtotal: subtotal,
        shippingCost: shippingCost,
        total: total,
        shippingMethod: shippingOption.service,
        items: cart.map(c => ({
            productId: c.id,
            productName: c.name,
            quantity: c.quantity,
            unitPrice: c.price
        })),
    };
};

/** Mapeia linha do Supabase para tipo Order do domínio */
function mapOrderRow(row: {
    id: string;
    cliente_id: string | null;
    status: string;
    created_at: string;
    subtotal: number;
    shipping_cost: number | null;
    total: number;
    shipping_method: string | null;
    payment_method?: string | null;
    payment_details?: { service?: string } | null;
    order_items?: Array<{
        product_id: string;
        product_name: string | null;
        quantity: number;
        unit_price: number;
    }>;
}): Order {
    return {
        id: row.id,
        clientId: row.cliente_id ?? '',
        status: row.status as OrderStatus,
        createdAt: row.created_at,
        subtotal: row.subtotal,
        shippingCost: row.shipping_cost ?? 0,
        total: row.total,
        paymentMethod: row.payment_method ?? undefined,
        shippingMethod: row.shipping_method ?? row.payment_details?.service ?? undefined,
        items: (row.order_items ?? []).map((item) => ({
            productId: item.product_id,
            productName: item.product_name ?? '',
            quantity: item.quantity,
            unitPrice: item.unit_price
        })),
    };
}

/** Lista pedidos do cliente no Supabase */
export const fetchOrders = async (clientId: string): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            id,
            cliente_id,
            status,
            created_at,
            subtotal,
            shipping_cost,
            total,
            shipping_method,
            payment_method,
            payment_details,
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
        console.error('Error fetching orders:', error);
        return [];
    }

    return (data ?? []).map(mapOrderRow);
};

/** Busca um pedido por ID (apenas se pertencer ao clientId, via RLS) */
export const fetchOrderById = async (orderId: string, clientId: string): Promise<Order | null> => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            id,
            cliente_id,
            status,
            created_at,
            subtotal,
            shipping_cost,
            total,
            shipping_method,
            payment_method,
            payment_details,
            order_items (
                product_id,
                product_name,
                quantity,
                unit_price
            )
        `)
        .eq('id', orderId)
        .eq('cliente_id', clientId)
        .single();

    if (error || !data) {
        if (error?.code !== 'PGRST116') console.error('Error fetching order:', error);
        return null;
    }

    return mapOrderRow(data);
};

/** Verifica disponibilidade de estoque para itens do carrinho */
export const checkStockAvailability = async (cart: CartItem[]): Promise<void> => {
    const ids = cart.map(c => c.id);
    const { data, error } = await supabase
        .from('products')
        .select('id, stock, name')
        .in('id', ids);

    if (error) {
        console.error('Error checking stock:', error);
        throw new Error('Erro ao verificar estoque.');
    }

    const products = data || [];
    for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (!product) {
            throw new Error(`Produto "${item.name}" não está mais disponível.`);
        }
        if (product.stock < item.quantity) {
            throw new Error(`Estoque insuficiente para "${item.name}". Restam apenas ${product.stock} unidades.`);
        }
    }
};


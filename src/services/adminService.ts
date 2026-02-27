import { supabase } from './supabase';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalClientes: number;
}

export interface RecentOrderRow {
  id: string;
  cliente: string;
  total: number;
  status: string;
  date: string;
}

/** Estatísticas e últimos pedidos para o dashboard admin.
 *  @param vendedorId - quando informado, filtra apenas pedidos deste vendedor
 */
export const getDashboardStats = async (vendedorId?: string): Promise<{
  stats: DashboardStats;
  recentOrders: RecentOrderRow[];
}> => {
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  // Helper para aplicar filtro de vendedor quando necessário
  const applyVendedorFilter = (query: any) =>
    vendedorId ? query.eq('vendedor_id', vendedorId) : query;

  const [
    { data: recentData },
    { count: totalOrders },
    { count: pendingCount },
    { data: monthOrders },
  ] = await Promise.all([
    applyVendedorFilter(
      supabase
        .from('orders')
        .select('id, total, status, created_at, cliente_id')
        .order('created_at', { ascending: false })
        .limit(5)
    ),
    applyVendedorFilter(
      supabase.from('orders').select('*', { count: 'exact', head: true })
    ),
    applyVendedorFilter(
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['aguardando_pagamento', 'pago', 'em_separacao'])
    ),
    applyVendedorFilter(
      supabase
        .from('orders')
        .select('total')
        .gte('created_at', startOfMonth)
        .neq('status', 'cancelado')
    ),
  ]);

  const totalRevenue = (monthOrders ?? []).reduce(
    (acc: number, o: { total: number }) => acc + (o.total ?? 0),
    0
  );

  const stats: DashboardStats = {
    totalRevenue,
    totalOrders: totalOrders ?? 0,
    pendingOrders: pendingCount ?? 0,
    totalClientes: 0,
  };

  const rows = (recentData ?? []) as Array<{
    id: string;
    total: number;
    status: string;
    created_at: string;
    cliente_id: string;
  }>;

  const formatRelativeDate = (iso: string): string => {
    const d = new Date(iso);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24)
      return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return d.toLocaleDateString('pt-BR');
  };

  const recentOrders: RecentOrderRow[] = rows.map((o) => ({
    id: o.id,
    cliente: o.cliente_id ?? 'Cliente',
    total: o.total,
    status: o.status,
    date: formatRelativeDate(o.created_at),
  }));

  return { stats, recentOrders };
};

export interface OrderAdminRow {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  shippingCost: number;
  shippingMethod: string | null;
  total: number;
  status: string;
  createdAt: string;
  paymentMethod?: string | null;
  trackingCode?: string | null;
}

/** Lista pedidos para admin (com nome/telefone do cliente).
 *  @param vendedorId - quando informado, filtra apenas pedidos deste vendedor
 */
export const getOrdersAdmin = async (vendedorId?: string): Promise<OrderAdminRow[]> => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      profiles:cliente_id(name, email, phone, street, number, complement, neighborhood, city, state, zip_code),
      order_items(product_id, product_name, quantity, unit_price)
    `)
    .order('created_at', { ascending: false });

  if (vendedorId) {
    query = (query as any).eq('vendedor_id', vendedorId);
  }

  const { data, error } = await query;

  if (error) throw error;

  type ProfileRow = {
    name?: string; email?: string; phone?: string;
    street?: string; number?: string; complement?: string;
    neighborhood?: string; city?: string; state?: string; zip_code?: string;
  };

  return (data ?? []).map((order: any) => {
    const p = order.profiles as ProfileRow | undefined;
    const addressParts = [
      p?.street, p?.number, p?.complement, p?.neighborhood,
      p?.city, p?.state ? `-${p.state}` : '', p?.zip_code
    ].filter(Boolean).join(' ');

    return {
      id: order.id,
      clientId: order.cliente_id ?? '',
      clientName: p?.name || p?.email || order.cliente_id || 'Cliente',
      clientPhone: p?.phone || '',
      clientAddress: addressParts || 'Endereço não informado',
      items: (order.order_items || []).map((item: any) => ({
        productId: item.product_id ?? '',
        productName: item.product_name ?? 'Produto',
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
      subtotal: order.subtotal,
      shippingCost: order.shipping_cost,
      shippingMethod: order.shipping_method ?? null,
      total: order.total,
      status: order.status,
      createdAt: order.created_at,
      paymentMethod: order.payment_method,
      trackingCode: order.tracking_code,
    };
  });
};

/** Atualiza status de um pedido. */
export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<void> => {
  const { error } = await (supabase.from('orders') as any)
    .update({ status })
    .eq('id', orderId);
  if (error) throw error;
};

/** Atualiza código de rastreio de um pedido. */
export const updateOrderTracking = async (
  orderId: string,
  trackingCode: string
): Promise<void> => {
  const { error } = await (supabase.from('orders') as any)
    .update({ tracking_code: trackingCode })
    .eq('id', orderId);
  if (error) throw error;
};

export interface SalesSummary {
  total_revenue: number;
  total_orders: number;
  paid_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  avg_ticket: number;
  orders_today: number;
  revenue_today: number;
}

export interface DailySale {
  date: string;
  revenue: number;
  orders: number;
}

export interface ProductRank {
  product_name: string;
  product_id: string;
  total_sold: number;
  total_revenue: number;
}

/** Resumo de vendas (RPC). */
export const getSalesSummary = async (
  periodDays: number
): Promise<SalesSummary | null> => {
  const { data } = await (supabase as any).rpc('get_sales_summary', {
    period_days: periodDays,
  });
  return data as SalesSummary | null;
};

/** Vendas por dia (RPC). */
export const getDailySales = async (
  periodDays: number
): Promise<DailySale[]> => {
  const { data } = await (supabase as any).rpc('get_daily_sales', {
    period_days: periodDays,
  });
  return (data as DailySale[]) ?? [];
};

/** Ranking de produtos (RPC). */
export const getProductRanking = async (
  maxResults: number = 10
): Promise<ProductRank[]> => {
  const { data } = await (supabase as any).rpc('get_product_ranking', {
    max_results: maxResults,
  });
  return (data as ProductRank[]) ?? [];
};

/** Restaura estoque de pedidos não pagos (RPC). */
export const restoreStockFromUnpaidOrders = async (): Promise<void> => {
  const { error } = await supabase.rpc('restore_stock_from_unpaid_orders');
  if (error) throw error;
};

export interface AdminUserRow {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  created_at: string | null;
}

/** Retorna a lista de usuários para painel admin. */
export const getUsersAdmin = async (): Promise<AdminUserRow[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AdminUserRow[];
};

/** Atualiza a permissão (role) de um usuário. */
export const updateUserRole = async (userId: string, role: string): Promise<void> => {
  const { error } = await (supabase.from('profiles') as any)
    .update({ role })
    .eq('id', userId);

  if (error) throw error;
};

export interface AISettings {
  id?: string;
  provider: string;
  api_key: string;
  model: string | null;
}

/** Obtém as configurações de IA. */
export const getAISettings = async (): Promise<AISettings | null> => {
  const { data, error } = await supabase
    .from('ai_settings')
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return data as AISettings | null;
};


/** Salva as configurações de IA. */
export const saveAISettings = async (settings: Omit<AISettings, 'id'>): Promise<void> => {
  // Try to get first to see if we update or insert
  const current = await getAISettings();

  if (current?.id) {
    const { error } = await (supabase.from('ai_settings') as any)
      .update({
        provider: settings.provider,
        api_key: settings.api_key,
        model: settings.model
      })
      .eq('id', current.id);
    if (error) throw error;
  } else {
    const { error } = await (supabase.from('ai_settings') as any)
      .insert([settings]);
    if (error) throw error;
  }
};

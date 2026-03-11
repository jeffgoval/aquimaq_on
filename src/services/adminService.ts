import { supabase } from './supabase';

export interface StockAlertRow {
  id: string;
  name: string;
  stock: number;
  reorderPoint: number | null;
  expiryDate: string | null;
  warehouseLocation: string | null;
  supplier: string | null;
  alertType: 'low_stock' | 'reorder' | 'expiring' | 'expired';
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalClientes: number;
  revenueChange?: number; // % vs mês anterior (undefined se sem dados)
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
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  // Helper para aplicar filtro de vendedor quando necessário
  const applyVendedorFilter = (query: any) =>
    vendedorId ? query.eq('vendedor_id', vendedorId) : query;

  const [
    { data: recentData },
    { count: totalOrders },
    { count: pendingCount },
    { data: monthOrders },
    clientesResult,
    { data: prevMonthOrders },
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
    vendedorId
      // Vendedor: clientes únicos nos seus pedidos
      ? supabase
          .from('orders')
          .select('cliente_id')
          .eq('vendedor_id', vendedorId)
      // Admin/gerente: total de perfis com role cliente
      : supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'cliente'),
    applyVendedorFilter(
      supabase
        .from('orders')
        .select('total')
        .gte('created_at', startOfPrevMonth)
        .lt('created_at', startOfMonth)
        .neq('status', 'cancelado')
    ),
  ]);

  const totalRevenue = (monthOrders ?? []).reduce(
    (acc: number, o: { total: number }) => acc + (o.total ?? 0),
    0
  );

  const prevRevenue = (prevMonthOrders ?? []).reduce(
    (acc: number, o: { total: number }) => acc + (o.total ?? 0),
    0
  );

  const revenueChange = prevRevenue > 0
    ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
    : undefined;

  const totalClientes = vendedorId
    ? new Set((clientesResult.data ?? []).map((r: any) => r.cliente_id)).size
    : (clientesResult.count ?? 0);

  const stats: DashboardStats = {
    totalRevenue,
    totalOrders: totalOrders ?? 0,
    pendingOrders: pendingCount ?? 0,
    totalClientes,
    revenueChange,
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
  meOrderId?: string | null;
}

export interface GetOrdersAdminParams {
  vendedorId?: string;
  page?: number;
  pageSize?: number;
  status?: string;    // 'all' ou undefined = sem filtro
  unlimited?: boolean; // ignora paginação (carrega tudo p/ busca client-side)
}

/** Lista pedidos para admin (com nome/telefone do cliente).
 *  Com paginação server-side e filtro por status.
 *  Quando `unlimited=true`, ignora paginação (p/ busca client-side dentro de um status).
 */
export const getOrdersAdmin = async (
  params: GetOrdersAdminParams = {}
): Promise<{ orders: OrderAdminRow[]; total: number }> => {
  const { vendedorId, page = 1, pageSize = 20, status, unlimited = false } = params;

  const selectCols = `
    *,
    profiles:cliente_id(name, email, phone, street, number, complement, neighborhood, city, state, zip_code),
    order_items(product_id, product_name, quantity, unit_price)
  `;

  let query = (supabase
    .from('orders')
    .select(selectCols, unlimited ? {} : { count: 'exact' })
    .order('created_at', { ascending: false }) as any);

  if (vendedorId) query = query.eq('vendedor_id', vendedorId);
  if (status && status !== 'all') query = query.eq('status', status);

  if (!unlimited) {
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  type ProfileRow = {
    name?: string; email?: string; phone?: string;
    street?: string; number?: string; complement?: string;
    neighborhood?: string; city?: string; state?: string; zip_code?: string;
  };

  const orders = (data ?? []).map((order: any) => {
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
      meOrderId: order.me_order_id ?? null,
    } as OrderAdminRow;
  });

  return { orders, total: unlimited ? orders.length : (count ?? 0) };
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

/** Atualiza status de múltiplos pedidos em uma única operação. */
export const updateOrderStatusBulk = async (
  orderIds: string[],
  status: string
): Promise<void> => {
  if (orderIds.length === 0) return;
  const { error } = await (supabase.from('orders') as any)
    .update({ status })
    .in('id', orderIds);
  if (error) throw error;
};


/** Solicita impressão de etiqueta térmica via Melhor Envios. Retorna URL do PDF. */
export const printMelhorEnviosLabel = async (orderId: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('melhor-envios-print', {
    body: { orderId },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('URL do PDF não retornada');
  return data.url as string;
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


const LOW_STOCK_THRESHOLD = 5;
const EXPIRY_WARNING_DAYS = 60;

/** Busca produtos com alertas de estoque (baixo, ponto de recompra, vencendo, vencidos). */
export const getStockAlerts = async (): Promise<StockAlertRow[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, stock, reorder_point, expiry_date, warehouse_location, supplier')
    .eq('is_active', true)
    .order('stock', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  const today = new Date();
  const warningDate = new Date(today);
  warningDate.setDate(warningDate.getDate() + EXPIRY_WARNING_DAYS);

  const alerts: StockAlertRow[] = [];

  for (const p of data) {
    const stock = p.stock ?? 0;
    const reorderPoint = p.reorder_point ?? null;

    // Vencido
    if (p.expiry_date) {
      const expiry = new Date(p.expiry_date);
      if (expiry < today) {
        alerts.push({ id: p.id, name: p.name, stock, reorderPoint, expiryDate: p.expiry_date, warehouseLocation: p.warehouse_location, supplier: p.supplier, alertType: 'expired' });
        continue;
      }
      // Vencendo em breve
      if (expiry <= warningDate) {
        alerts.push({ id: p.id, name: p.name, stock, reorderPoint, expiryDate: p.expiry_date, warehouseLocation: p.warehouse_location, supplier: p.supplier, alertType: 'expiring' });
        continue;
      }
    }

    // Ponto de recompra
    if (reorderPoint !== null && stock <= reorderPoint) {
      alerts.push({ id: p.id, name: p.name, stock, reorderPoint, expiryDate: p.expiry_date, warehouseLocation: p.warehouse_location, supplier: p.supplier, alertType: 'reorder' });
      continue;
    }

    // Estoque baixo geral
    if (stock <= LOW_STOCK_THRESHOLD) {
      alerts.push({ id: p.id, name: p.name, stock, reorderPoint, expiryDate: p.expiry_date, warehouseLocation: p.warehouse_location, supplier: p.supplier, alertType: 'low_stock' });
    }
  }

  return alerts;
};

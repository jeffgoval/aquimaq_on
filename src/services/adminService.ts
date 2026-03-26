import { ROUTES } from '@/constants/routes';
import { supabase } from './supabase';
import { ENV } from '@/config/env';

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
  totalRevenue: number;      // receita do mês (excluindo cancelados)
  pendingPayment: number;    // aguardando_pagamento
  toDispatch: number;        // pago + em_separacao (prontos para enviar)
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
    { count: pendingPaymentCount },
    { count: toDispatchCount },
    { data: monthOrders },
    clientesResult,
  ] = await Promise.all([
    // Últimos 8 pedidos com nome do cliente
    applyVendedorFilter(
      supabase
        .from('orders')
        .select('id, total, status, created_at, profiles:cliente_id(name, email)')
        .order('created_at', { ascending: false })
        .limit(8)
    ),
    // Pedidos aguardando pagamento
    applyVendedorFilter(
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aguardando_pagamento')
    ),
    // Pedidos prontos para despachar (pago + em_separacao)
    applyVendedorFilter(
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pago', 'em_separacao'])
    ),
    // Receita do mês (excluindo cancelados)
    applyVendedorFilter(
      supabase
        .from('orders')
        .select('total')
        .gte('created_at', startOfMonth)
        .neq('status', 'cancelado')
    ),
    vendedorId
      ? supabase.from('orders').select('cliente_id').eq('vendedor_id', vendedorId)
      : supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'cliente'),
  ]);

  const totalRevenue = (monthOrders ?? []).reduce(
    (acc: number, o: { total: number }) => acc + (o.total ?? 0),
    0
  );

  const totalClientes = vendedorId
    ? new Set((clientesResult.data ?? []).map((r: any) => r.cliente_id)).size
    : (clientesResult.count ?? 0);

  const stats: DashboardStats = {
    totalRevenue,
    pendingPayment: pendingPaymentCount ?? 0,
    toDispatch: toDispatchCount ?? 0,
    totalClientes,
  };

  const formatRelativeDate = (iso: string): string => {
    const d = new Date(iso);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return d.toLocaleDateString('pt-BR');
  };

  const recentOrders: RecentOrderRow[] = (recentData ?? []).map((o: any) => {
    const p = o.profiles as { name?: string; email?: string } | null;
    return {
      id: o.id,
      cliente: p?.name || p?.email || 'Cliente',
      total: o.total,
      status: o.status,
      date: formatRelativeDate(o.created_at),
    };
  });

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
  shippingMethodLabel: string | null;
  total: number;
  status: string;
  createdAt: string;
  paymentMethod?: string | null;
  trackingCode?: string | null;
  meOrderId?: string | null;
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
      shippingMethodLabel: order.shipping_method_label ?? null,
      total: order.total,
      status: order.status,
      createdAt: order.created_at,
      paymentMethod: order.payment_method,
      trackingCode: order.tracking_code,
      meOrderId: order.me_order_id ?? null,
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

export const getOrderStatus = async (orderId: string): Promise<string | null> => {
  const { data, error } = await (supabase.from('orders') as any)
    .select('status')
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw error;
  return (data?.status as string | null | undefined) ?? null;
};


/**
 * Abre a aba de impressão da etiqueta no mesmo “turno” do clique (evita bloqueio de pop-up).
 * O caller deve chamar isto ANTES de qualquer `await` (ex.: antes de `updateOrderStatus`).
 */
export const tryOpenMelhorEnviosLabelTab = (orderId: string): boolean => {
  const url = `${window.location.origin}${getAdminMePrintUrl(orderId, 'label')}`;
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  return !!win;
};

/**
 * Abre a etiqueta em nova aba (para CTAs secundários onde já há gesto do utilizador).
 */
export const printMelhorEnviosLabel = async (orderId: string): Promise<void> => {
  if (!tryOpenMelhorEnviosLabelTab(orderId)) {
    throw new Error('POPUP_BLOCKED');
  }
};

/** Abre a página/URL de impressão da ME (pode conter outros documentos além da etiqueta). */
export const openMelhorEnviosPrintPage = async (orderId: string): Promise<void> => {
  // Navegação deve ser feita pelo caller (sem pop-up).
  void orderId;
  throw new Error('Use getAdminMePrintUrl(orderId, "docs") para navegar.');
};

export const getAdminMePrintUrl = (orderId: string, kind: 'label' | 'docs'): string => {
  return `${ROUTES.ADMIN_ME_PRINT}?orderId=${encodeURIComponent(orderId)}&kind=${encodeURIComponent(kind)}`;
};

export interface MeTrackingSyncResult {
  trackingCode: string | null;
  trackingUrl: string | null;
}

export const syncOrderTrackingFromMelhorEnvios = async (orderId: string): Promise<MeTrackingSyncResult> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sessão expirada. Faça login novamente.');

  const res = await fetch(`${ENV.VITE_SUPABASE_URL}/functions/v1/me-sync-tracking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: ENV.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ orderId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let msg = `Erro ao sincronizar rastreio (${res.status}).`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed.error) msg = parsed.error;
    } catch {
      if (text.trim()) msg = text.trim();
    }
    throw new Error(msg);
  }

  const data = (await res.json()) as Partial<MeTrackingSyncResult>;
  return {
    trackingCode: typeof data.trackingCode === 'string' ? data.trackingCode : null,
    trackingUrl: typeof data.trackingUrl === 'string' ? data.trackingUrl : null,
  };
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

export interface ShippingOrderRow {
  id: string;
  createdAt: string;
  meOrderId: string | null;
  shippingMethodLabel: string | null;
  shippingStatus: string | null;
  trackingCode: string | null;
  clienteName: string;
}

/** Lista pedidos do Melhor Envios (mesmo antes de gerar a etiqueta). */
export const getShippingOrders = async (): Promise<ShippingOrderRow[]> => {
  const { data, error } = await (supabase
    .from('orders') as any)
    // Importante: a relação correta é orders.cliente_id -> profiles.id
    .select('id, created_at, me_order_id, shipping_method_label, shipping_status, tracking_code, profiles:cliente_id(name)')
    // Mostra:
    // - pedidos que já têm me_order_id (etiqueta criada)
    // - pedidos cujo método de envio é do Melhor Envios (IDs começam com "me_"), mesmo sem etiqueta ainda
    .or('me_order_id.not.is.null,shipping_method.like.me_%')
    // Não esconder sandbox: em teste o pedido pode ficar em aguardando_pagamento
    // (webhook MP não aprovou / não retornou). Só ocultamos rascunhos.
    .neq('status', 'draft')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((o: any) => ({
    id: o.id,
    createdAt: o.created_at,
    meOrderId: o.me_order_id ?? null,
    shippingMethodLabel: o.shipping_method_label ?? null,
    shippingStatus: o.shipping_status ?? null,
    trackingCode: o.tracking_code ?? null,
    clienteName: o.profiles?.name ?? '—',
  }));
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

import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    Package, ChevronDown, ChevronUp, ExternalLink,
    ShoppingBag, AlertCircle, Truck, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { useOrders } from '@/hooks/useOrders';
import { StatusBadge } from '@/components/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { OrderStatus, type Order } from '@/types';
import { formatCurrency } from '@/utils/format';

// ─── Filter helpers ───────────────────────────────────────────────────────────
type FilterKey = 'all' | 'pending' | 'active' | 'delivered' | 'cancelled';

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all',       label: 'Todos' },
    { key: 'pending',   label: 'Aguardando' },
    { key: 'active',    label: 'Em andamento' },
    { key: 'delivered', label: 'Entregues' },
    { key: 'cancelled', label: 'Cancelados' },
];

const ACTIVE_STATUSES = [
    OrderStatus.PAID, OrderStatus.PICKING, OrderStatus.SHIPPED, OrderStatus.READY_PICKUP,
];

function filterOrders(orders: Order[], key: FilterKey): Order[] {
    switch (key) {
        case 'pending':   return orders.filter(o => o.status === OrderStatus.WAITING_PAYMENT);
        case 'active':    return orders.filter(o => ACTIVE_STATUSES.includes(o.status));
        case 'delivered': return orders.filter(o => o.status === OrderStatus.DELIVERED);
        case 'cancelled': return orders.filter(o => o.status === OrderStatus.CANCELLED);
        default:          return orders;
    }
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
const OrderSkeleton: React.FC = () => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
        <div className="px-5 py-4 flex justify-between items-center border-b border-slate-100">
            <div className="space-y-2">
                <div className="h-3.5 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
            <div className="h-6 w-20 bg-slate-200 rounded-full" />
        </div>
        <div className="px-5 py-4 space-y-2">
            <div className="h-3 w-3/4 bg-slate-100 rounded" />
            <div className="h-3 w-1/2 bg-slate-100 rounded" />
        </div>
    </div>
);

// ─── Single order card ────────────────────────────────────────────────────────
const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
    const [open, setOpen] = useState(false);

    const formattedDate = new Date(order.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric',
    });

    const isWaitingPayment = order.status === OrderStatus.WAITING_PAYMENT;
    const isShipped = order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED;

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* Card header — always visible */}
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <Package size={18} className="text-agro-500 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                            Pedido #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-400">{formattedDate}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-bold text-slate-900 hidden sm:block">
                        {formatCurrency(order.total)}
                    </span>
                    {open
                        ? <ChevronUp size={16} className="text-slate-400" />
                        : <ChevronDown size={16} className="text-slate-400" />
                    }
                </div>
            </button>

            {/* Expanded content */}
            {open && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                    {/* Items */}
                    <ul className="space-y-1.5">
                        {order.items.map((item, i) => (
                            <li key={i} className="flex justify-between text-sm">
                                <span className="text-slate-600">
                                    <span className="font-medium text-slate-800">{item.quantity}×</span>{' '}
                                    {item.productName}
                                </span>
                                <span className="font-medium text-slate-800 shrink-0 ml-4">
                                    {formatCurrency(item.unitPrice * item.quantity)}
                                </span>
                            </li>
                        ))}
                    </ul>

                    {/* Totals */}
                    <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1.5 border border-slate-100">
                        <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal || order.total)}</span>
                        </div>
                        {order.shippingCost !== undefined && (
                            <div className="flex justify-between text-slate-500">
                                <span>Frete{order.shippingMethod ? ` · ${order.shippingMethod}` : ''}</span>
                                <span>{order.shippingCost === 0 ? 'Grátis' : formatCurrency(order.shippingCost)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                            <span>Total</span>
                            <span>{formatCurrency(order.total)}</span>
                        </div>
                    </div>

                    {/* Tracking */}
                    {order.trackingCode && (
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
                            <Truck size={16} className="text-blue-500 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium text-blue-800">Código de rastreio</p>
                                <p className="text-blue-700 font-mono mt-0.5">{order.trackingCode}</p>
                                {isShipped && (
                                    <a
                                        href={`https://www.correios.com.br/rastreamento/#/search?objects=${order.trackingCode}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium mt-1.5 transition-colors"
                                    >
                                        Rastrear envio <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Waiting payment alert */}
                    {isWaitingPayment && (
                        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                            <AlertCircle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                            <div className="text-sm">
                                <p className="font-medium text-yellow-800">Aguardando pagamento</p>
                                <p className="text-yellow-700 mt-0.5">
                                    A confirmação pode levar alguns minutos após o pagamento.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Delivered badge */}
                    {order.status === OrderStatus.DELIVERED && (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                            <CheckCircle2 size={15} className="shrink-0" />
                            Pedido entregue com sucesso!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const OrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { settings } = useStore();
    const { data: orders = [], isLoading, error } = useOrders(user?.id);
    const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

    const storeName = settings?.storeName || 'Aquimaq';

    // Redirect if not authenticated
    React.useEffect(() => {
        if (!authLoading && !user) navigate(ROUTES.LOGIN, { replace: true });
    }, [user, authLoading, navigate]);

    const filtered = useMemo(() => filterOrders(orders, activeFilter), [orders, activeFilter]);

    // Count per filter for badge
    const counts = useMemo(() => ({
        all:       orders.length,
        pending:   orders.filter(o => o.status === OrderStatus.WAITING_PAYMENT).length,
        active:    orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length,
        delivered: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
        cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
    }), [orders]);

    if (authLoading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-agro-200 border-t-agro-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <Helmet>
                <title>Meus Pedidos | {storeName}</title>
            </Helmet>

            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Meus Pedidos</h1>
                    {!isLoading && (
                        <p className="text-sm text-slate-500 mt-0.5">
                            {orders.length === 0
                                ? 'Nenhum pedido realizado'
                                : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} no total`}
                        </p>
                    )}
                </div>
                <Link
                    to={ROUTES.ACCOUNT}
                    className="text-sm text-agro-600 hover:text-agro-700 font-medium transition-colors"
                >
                    Minha conta
                </Link>
            </div>

            {/* Filter chips */}
            {!isLoading && orders.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-6">
                    {FILTERS.map(f => {
                        const count = counts[f.key];
                        if (f.key !== 'all' && count === 0) return null;
                        return (
                            <button
                                key={f.key}
                                onClick={() => setActiveFilter(f.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeFilter === f.key
                                    ? 'bg-agro-600 text-white border-agro-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-agro-300'
                                }`}
                            >
                                {f.label}
                                {f.key !== 'all' && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeFilter === f.key
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4" role="alert">
                    Erro ao carregar pedidos. Tente recarregar a página.
                </div>
            )}

            {/* Loading skeletons */}
            {isLoading && (
                <div className="space-y-3">
                    {[1, 2, 3].map(n => <OrderSkeleton key={n} />)}
                </div>
            )}

            {/* Order list */}
            {!isLoading && filtered.length > 0 && (
                <div className="space-y-3">
                    {filtered.map(order => <OrderCard key={order.id} order={order} />)}
                </div>
            )}

            {/* Empty state — no orders at all */}
            {!isLoading && orders.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-agro-50 rounded-full flex items-center justify-center mb-4">
                        <ShoppingBag size={28} className="text-agro-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800 mb-1">Nenhum pedido ainda</h2>
                    <p className="text-slate-500 text-sm mb-6 max-w-xs">
                        Quando você fizer uma compra, seus pedidos aparecerão aqui.
                    </p>
                    <Link
                        to={ROUTES.HOME}
                        className="px-6 py-2.5 bg-agro-600 text-white rounded-lg text-sm font-semibold hover:bg-agro-700 transition-colors"
                    >
                        Explorar produtos
                    </Link>
                </div>
            )}

            {/* Empty state — filter returns no results */}
            {!isLoading && orders.length > 0 && filtered.length === 0 && (
                <div className="py-10 text-center text-slate-500 text-sm">
                    Nenhum pedido nesta categoria.
                    <button
                        onClick={() => setActiveFilter('all')}
                        className="ml-1 text-agro-600 hover:text-agro-700 font-medium"
                    >
                        Ver todos
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;

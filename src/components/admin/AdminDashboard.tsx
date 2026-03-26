import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, Package, Clock, AlertTriangle,
    ChevronRight, RotateCcw, CalendarX2, ShoppingCart,
    MapPin, Truck, CheckCircle,
} from 'lucide-react';
import {
    getDashboardStats,
    restoreStockFromUnpaidOrders,
    getStockAlerts,
    type StockAlertRow,
    type RecentOrderRow,
} from '@/services/adminService';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ROUTES } from '@/constants/routes';

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

const statusConfig: Record<string, { label: string; color: string }> = {
    aguardando_pagamento: { label: 'Aguardando pagamento', color: 'text-amber-700 bg-amber-50' },
    pago:                { label: 'Pago',                  color: 'text-blue-700 bg-blue-50' },
    em_separacao:        { label: 'Em separação',          color: 'text-blue-700 bg-blue-50' },
    enviado:             { label: 'Enviado',               color: 'text-violet-700 bg-violet-50' },
    entregue:            { label: 'Entregue',              color: 'text-emerald-700 bg-emerald-50' },
    cancelado:           { label: 'Cancelado',             color: 'text-stone-500 bg-stone-100' },
};

interface AdminDashboardProps {
    onNavigate: (view: 'ORDERS' | 'PRODUCTS' | 'USERS') => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
    const { user, hasRole } = useAuth();
    const isVendedor = hasRole(['vendedor']);
    const navigate = useNavigate();

    const goOrders = (status?: string) => {
        const path = ROUTES.ADMIN_ORDERS + (status ? `?status=${status}` : '');
        navigate(path);
    };

    const [stats, setStats] = useState({ totalRevenue: 0, pendingPayment: 0, toDispatch: 0, totalClientes: 0 });
    const [recentOrders, setRecentOrders] = useState<RecentOrderRow[]>([]);
    const [stockAlerts, setStockAlerts] = useState<StockAlertRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

    useEffect(() => {
        let mounted = true;
        const timeout = setTimeout(() => {
            if (mounted && loading) {
                setError('Demorou a carregar. Pode tentar recarregar a página.');
                setLoading(false);
            }
        }, 8000);

        (async () => {
            try {
                // Removido o filtro por vendedorId temporariamente para exibir as métricas gerais para quem opera o painel
                const [{ stats: s, recentOrders: r }, alerts] = await Promise.all([
                    getDashboardStats(),
                    getStockAlerts(),
                ]);
                if (mounted) {
                    setStats(s);
                    setRecentOrders(r);
                    setStockAlerts(alerts);
                    setError(null);
                }
            } catch {
                if (mounted) setError('Não foi possível carregar. Tente outra vez.');
            } finally {
                if (mounted) { setLoading(false); clearTimeout(timeout); }
            }
        })();

        return () => { mounted = false; clearTimeout(timeout); };
    }, [isVendedor, user?.id]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
                <div className="h-8 w-48 bg-stone-100 rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-28 bg-stone-100 rounded-2xl" />)}
                </div>
                <div className="h-64 bg-stone-100 rounded-2xl" />
                <div className="h-48 bg-stone-100 rounded-2xl" />
            </div>
        );
    }

    return (
        <>
        <div className="max-w-4xl mx-auto space-y-5">

            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-stone-800">
                        {isVendedor ? 'Minhas Vendas' : 'Painel da Loja'}
                    </h1>
                </div>
                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg">
                        {error}
                    </p>
                )}
            </div>

            {/* Resumo do mês */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Faturado este mês */}
                <div className="bg-emerald-600 text-white rounded-2xl p-5">
                    <div className="flex items-center gap-2 opacity-80 mb-2">
                        <DollarSign size={16} />
                        <span className="text-sm font-medium">Faturado este mês</span>
                    </div>
                    <p className="text-3xl font-bold leading-none">{fmt(stats.totalRevenue)}</p>
                    <p className="text-emerald-200 text-xs mt-2">Pedidos pagos em {mesAtual}</p>
                </div>

                {/* À espera que o cliente pague */}
                <button
                    onClick={() => goOrders('aguardando_pagamento')}
                    className={`rounded-2xl p-5 text-left transition-colors ${
                        stats.pendingPayment > 0
                            ? 'bg-amber-50 border-2 border-amber-300 hover:bg-amber-100'
                            : 'bg-white border border-stone-100 hover:border-stone-200'
                    }`}
                >
                    <div className="flex items-center gap-2 text-stone-400 mb-2">
                        <Clock size={16} />
                        <span className="text-sm font-medium text-stone-500">À espera que o cliente pague</span>
                    </div>
                    <p className={`text-3xl font-bold leading-none ${stats.pendingPayment > 0 ? 'text-amber-700' : 'text-stone-800'}`}>
                        {stats.pendingPayment}
                    </p>
                    <p className="text-stone-400 text-xs mt-2 flex items-center gap-1">
                        {stats.pendingPayment > 0 ? 'Toque para ver' : 'Nenhum pendente'}
                        {stats.pendingPayment > 0 && <ChevronRight size={12} />}
                    </p>
                </button>

                {/* Prontos para enviar */}
                <button
                    onClick={() => goOrders('pago')}
                    className={`rounded-2xl p-5 text-left transition-colors ${
                        stats.toDispatch > 0
                            ? 'bg-blue-50 border-2 border-blue-200 hover:bg-blue-100'
                            : 'bg-white border border-stone-100 hover:border-stone-200'
                    }`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Truck size={16} className="text-stone-400" />
                        <span className="text-sm font-medium text-stone-500">Prontos para enviar</span>
                    </div>
                    <p className={`text-3xl font-bold leading-none ${stats.toDispatch > 0 ? 'text-blue-700' : 'text-stone-800'}`}>
                        {stats.toDispatch}
                    </p>
                    <p className="text-stone-400 text-xs mt-2 flex items-center gap-1">
                        {stats.toDispatch > 0 ? 'Pagos e à espera de envio' : 'Nenhum para enviar'}
                        {stats.toDispatch > 0 && <ChevronRight size={12} />}
                    </p>
                </button>
            </div>

            {/* Últimos pedidos */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-stone-700">Últimos pedidos</h2>
                    <button
                        onClick={() => onNavigate('ORDERS')}
                        className="text-xs text-stone-400 hover:text-stone-700 font-medium flex items-center gap-1"
                    >
                        Ver todos os pedidos <ChevronRight size={13} />
                    </button>
                </div>

                {recentOrders.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                        <CheckCircle size={32} className="text-stone-200 mx-auto mb-2" />
                        <p className="text-stone-400 text-sm">Nenhum pedido ainda.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-stone-50">
                        {recentOrders.map((order) => {
                            const cfg = statusConfig[order.status] ?? statusConfig['aguardando_pagamento'];
                            return (
                                <button
                                    key={order.id}
                                    onClick={() => onNavigate('ORDERS')}
                                    className="w-full flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-stone-50 transition-colors text-left"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-stone-800 truncate">{order.cliente}</p>
                                        <p className="text-xs text-stone-400 mt-0.5">{order.date}</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                                            {cfg.label}
                                        </span>
                                        <span className="text-sm font-bold text-stone-800 w-24 text-right">
                                            {fmt(order.total)}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Produtos a rever */}
            {stockAlerts.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                    <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div>
                            <h2 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
                                <AlertTriangle size={15} className="text-amber-500" />
                                Produtos a rever ({stockAlerts.length})
                            </h2>
                            <p className="text-xs text-stone-500 mt-0.5">
                                Produtos com stock baixo, em falta ou validade próxima.
                            </p>
                        </div>
                        <button
                            onClick={() => onNavigate('PRODUCTS')}
                            className="text-xs text-stone-400 hover:text-stone-700 font-medium flex items-center gap-1 self-start sm:self-center"
                        >
                            Ir para produtos <ChevronRight size={13} />
                        </button>
                    </div>
                    <div className="divide-y divide-stone-50">
                        {stockAlerts.map((alert) => {
                            const meta = {
                                expired:   { label: 'Vencido',        bg: 'text-red-700 bg-red-100',      icon: <CalendarX2 size={12} /> },
                                expiring:  { label: 'Vencendo em breve', bg: 'text-orange-700 bg-orange-100', icon: <CalendarX2 size={12} /> },
                                reorder:   { label: 'Estoque crítico', bg: 'text-amber-700 bg-amber-100',  icon: <ShoppingCart size={12} /> },
                                low_stock: { label: 'Estoque baixo',   bg: 'text-yellow-700 bg-yellow-100', icon: <Package size={12} /> },
                            }[alert.alertType];
                            return (
                                <div
                                    key={alert.id}
                                    className="px-5 py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-50 transition-colors"
                                    onClick={() => onNavigate('PRODUCTS')}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${meta.bg}`}>
                                            {meta.icon} {meta.label}
                                        </span>
                                        <span className="text-sm text-stone-700 truncate font-medium">{alert.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 text-xs text-stone-400">
                                        {alert.warehouseLocation && (
                                            <span className="hidden sm:flex items-center gap-1">
                                                <MapPin size={11} /> {alert.warehouseLocation}
                                            </span>
                                        )}
                                        {alert.expiryDate && (
                                            <span>Validade: {new Date(alert.expiryDate).toLocaleDateString('pt-BR')}</span>
                                        )}
                                        <span className={`font-bold ${alert.stock <= 0 ? 'text-red-600' : 'text-stone-600'}`}>
                                            {alert.stock <= 0 ? 'Zerado' : `${alert.stock} un.`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Libertar stock — utilitário discreto, só admin/gerente */}
            {!isVendedor && (
                <div className="flex items-center justify-between px-1">
                    <p className="text-xs text-stone-400">
                        Pode repor o stock que estava reservado em pedidos não pagos.
                    </p>
                    <button
                        onClick={() => setShowRestoreConfirm(true)}
                        disabled={restoreLoading}
                        className="text-xs text-stone-400 hover:text-amber-700 font-medium flex items-center gap-1 underline underline-offset-2 transition-colors disabled:opacity-50"
                    >
                        <RotateCcw size={12} />
                        {restoreLoading ? 'A repor...' : 'Libertar stock de pedidos não pagos'}
                    </button>
                    {restoreMsg && (
                        <p className="text-xs text-emerald-600 font-medium">{restoreMsg}</p>
                    )}
                </div>
            )}

        </div>

        <ConfirmDialog
            open={showRestoreConfirm}
            title="Libertar stock de pedidos não pagos"
            description="Isto devolve ao stock as quantidades reservadas em pedidos que não foram pagos. O inventário é atualizado de imediato."
            confirmLabel="Libertar stock"
            confirmClassName="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
            onCancel={() => setShowRestoreConfirm(false)}
            onConfirm={async () => {
                setShowRestoreConfirm(false);
                setRestoreLoading(true);
                setRestoreMsg(null);
                try {
                    await restoreStockFromUnpaidOrders();
                    setRestoreMsg('Stock reposto com sucesso.');
                    setTimeout(() => setRestoreMsg(null), 4000);
                } catch (e) {
                    setRestoreMsg(e instanceof Error ? e.message : 'Erro ao repor.');
                } finally {
                    setRestoreLoading(false);
                }
            }}
        />
        </>
    );
};

export default AdminDashboard;

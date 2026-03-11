import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Users,
    TrendingUp,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    RotateCcw,
    AlertTriangle,
    CalendarX2,
    ShoppingCart,
    MapPin,
} from 'lucide-react';
import {
    getDashboardStats,
    restoreStockFromUnpaidOrders,
    getStockAlerts,
    type StockAlertRow,
} from '@/services/adminService';
import { useAuth } from '@/contexts/AuthContext';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon }) => (
    <div className="bg-white rounded-xl p-5 border border-stone-100">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-stone-400 text-[12px] font-medium uppercase tracking-wide mb-1">{title}</p>
                <p className="text-2xl font-semibold text-stone-800">{value}</p>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 mt-1.5 text-[12px] font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span>{Math.abs(change)}% vs mês anterior</span>
                    </div>
                )}
            </div>
            <div className="w-10 h-10 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400">
                {icon}
            </div>
        </div>
    </div>
);

interface RecentOrderProps {
    id: string;
    cliente: string;
    total: number;
    status: string;
    date: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    'aguardando_pagamento': { label: 'Aguardando', color: 'text-amber-600 bg-amber-50' },
    'pago': { label: 'Pago', color: 'text-emerald-600 bg-emerald-50' },
    'em_separacao': { label: 'Separando', color: 'text-blue-600 bg-blue-50' },
    'enviado': { label: 'Enviado', color: 'text-violet-600 bg-violet-50' },
    'entregue': { label: 'Entregue', color: 'text-emerald-600 bg-emerald-50' },
    'cancelado': { label: 'Cancelado', color: 'text-stone-500 bg-stone-100' },
};

const RecentOrderRow: React.FC<RecentOrderProps> = ({ id, cliente, total, status, date }) => {
    const config = statusConfig[status] || statusConfig['aguardando_pagamento'];

    return (
        <tr className="border-b border-stone-50 last:border-0">
            <td className="py-3 px-4">
                <span className="font-mono text-[12px] text-stone-500">#{id.slice(-6).toUpperCase()}</span>
            </td>
            <td className="py-3 px-4">
                <span className="text-[13px] text-stone-700">{cliente}</span>
            </td>
            <td className="py-3 px-4">
                <span className="text-[13px] font-medium text-stone-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </span>
            </td>
            <td className="py-3 px-4">
                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${config.color}`}>
                    {config.label}
                </span>
            </td>
            <td className="py-3 px-4 text-right">
                <span className="text-[12px] text-stone-400">{date}</span>
            </td>
        </tr>
    );
};

interface AdminDashboardProps {
    onNavigate: (view: 'ORDERS' | 'PRODUCTS' | 'USERS') => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
    const { user, hasRole } = useAuth();
    const isVendedor = hasRole(['vendedor']);

    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalClientes: 0,
    });
    const [recentOrders, setRecentOrders] = useState<RecentOrderProps[]>([]);
    const [stockAlerts, setStockAlerts] = useState<StockAlertRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [restoreStockLoading, setRestoreStockLoading] = useState(false);
    const [restoreStockMessage, setRestoreStockMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        let mounted = true;
        const timeoutId = setTimeout(() => {
            if (mounted && loading) {
                setError('A conexão está lenta. Algumas informações podem não carregar.');
                setLoading(false);
            }
        }, 8000);

        const load = async () => {
            try {
                // Vendedor vê apenas suas próprias estatísticas
                const vendedorId = isVendedor ? user?.id : undefined;
                const [{ stats: nextStats, recentOrders: nextRecent }, alerts] = await Promise.all([
                    getDashboardStats(vendedorId),
                    !isVendedor ? getStockAlerts() : Promise.resolve([]),
                ]);
                if (mounted) {
                    setStats(nextStats);
                    setRecentOrders(nextRecent);
                    setStockAlerts(alerts);
                    setError(null);
                }
            } catch (e) {
                if (mounted) {
                    if (import.meta.env.DEV) console.error('AdminDashboard load:', e);
                    setError('Não foi possível carregar os dados do painel.');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                    clearTimeout(timeoutId);
                }
            }
        };
        load();
        return () => {
            mounted = false;
            clearTimeout(timeoutId);
        };
    }, [isVendedor, user?.id]);

    if (loading) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto">
                <div>
                    <h1 className="text-xl font-semibold text-stone-800">Dashboard</h1>
                    <p className="text-stone-400 text-[13px] mt-0.5">Carregando dados...</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-xl p-5 border border-stone-100 h-[104px]">
                            <div className="flex justify-between items-start">
                                <div className="space-y-3 pt-1">
                                    <div className="w-20 h-3 bg-stone-100 rounded"></div>
                                    <div className="w-24 h-6 bg-stone-100 rounded"></div>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-stone-50"></div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white border border-stone-100 rounded-xl p-4 h-[74px] flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-lg bg-stone-50"></div>
                            <div className="space-y-2 flex-1">
                                <div className="w-24 h-3 bg-stone-100 rounded"></div>
                                <div className="w-32 h-2.5 bg-stone-50 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-white rounded-xl border border-stone-100 h-[300px] animate-pulse">
                    <div className="px-5 py-4 border-b border-stone-50">
                        <div className="w-32 h-4 bg-stone-100 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
                        <LayoutDashboard className="text-stone-400" size={24} />
                        Dashboard
                    </h1>
                    <p className="text-stone-400 text-[13px] mt-0.5">
                        {isVendedor ? 'Resumo das suas vendas e pedidos' : 'Visão geral do seu negócio'}
                    </p>
                </div>
                {error && (
                    <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg flex items-center gap-2 relative">
                        <span>{error}</span>
                        <div className="absolute top-0 right-0 -mt-1 -mr-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>
                        <div className="absolute top-0 right-0 -mt-1 -mr-1 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Receita (mês)"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
                    icon={<TrendingUp size={20} />}
                />
                <StatCard
                    title="Pedidos"
                    value={stats.totalOrders}
                    icon={<ShoppingBag size={20} />}
                />
                <StatCard
                    title="Pendentes"
                    value={stats.pendingOrders}
                    icon={<Clock size={20} />}
                />
                <StatCard
                    title="Clientes"
                    value={stats.totalClientes}
                    icon={<Users size={20} />}
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                    onClick={() => onNavigate('ORDERS')}
                    className="group flex items-center gap-3 bg-white border border-stone-100 rounded-xl p-4 text-left hover:border-stone-200 transition-colors"
                >
                    <div className="w-10 h-10 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-stone-100 transition-colors">
                        <ShoppingBag size={20} />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-medium text-stone-700">Gerenciar Pedidos</h3>
                        <p className="text-stone-400 text-[12px]">Ver todos os pedidos</p>
                    </div>
                </button>
                <button
                    onClick={() => onNavigate('PRODUCTS')}
                    className="group flex items-center gap-3 bg-white border border-stone-100 rounded-xl p-4 text-left hover:border-stone-200 transition-colors"
                >
                    <div className="w-10 h-10 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-stone-100 transition-colors">
                        <Package size={20} />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-medium text-stone-700">Gerenciar Produtos</h3>
                        <p className="text-stone-400 text-[12px]">Editar preços e estoque</p>
                    </div>
                </button>
                {!isVendedor && (
                <button
                    onClick={() => onNavigate('USERS')}
                    className="group flex items-center gap-3 bg-white border border-stone-100 rounded-xl p-4 text-left hover:border-stone-200 transition-colors"
                >
                    <div className="w-10 h-10 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-stone-100 transition-colors">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-medium text-stone-700">Gerenciar Usuários</h3>
                        <p className="text-stone-400 text-[12px]">Administrar acessos</p>
                    </div>
                </button>
                )}
            </div>

            {/* Restaurar estoque de pedidos não pagos — apenas admin/gerente */}
            {!isVendedor && (
            <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-[13px] font-medium text-amber-800 flex items-center gap-2">
                            <RotateCcw size={18} />
                            Estoque de pedidos não pagos
                        </h3>
                        <p className="text-amber-700/80 text-[12px] mt-0.5">
                            Repõe o estoque dos produtos que foram reservados em pedidos ainda não pagos (evita zerar estoque em testes).
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={async () => {
                            setRestoreStockMessage(null);
                            setRestoreStockLoading(true);
                            try {
                                await restoreStockFromUnpaidOrders();
                                setRestoreStockMessage({ type: 'success', text: 'Estoque restaurado.' });
                            } catch (e) {
                                const msg = e instanceof Error ? e.message : 'Erro ao restaurar estoque.';
                                setRestoreStockMessage({ type: 'error', text: msg });
                            } finally {
                                setRestoreStockLoading(false);
                            }
                        }}
                        disabled={restoreStockLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-[13px] font-medium hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {restoreStockLoading ? 'Restaurando...' : 'Restaurar estoque'}
                    </button>
                </div>
                {restoreStockMessage && (
                    <p className={`mt-3 text-[12px] font-medium ${restoreStockMessage.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                        {restoreStockMessage.text}
                    </p>
                )}
            </div>
            )}

            {/* Stock Alerts */}
            {!isVendedor && stockAlerts.length > 0 && (
                <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-red-50 flex items-center justify-between bg-red-50/50">
                        <h2 className="text-[14px] font-medium text-red-700 flex items-center gap-2">
                            <AlertTriangle size={15} className="text-red-500" />
                            Alertas de Estoque ({stockAlerts.length})
                        </h2>
                        <button
                            onClick={() => onNavigate('PRODUCTS')}
                            className="text-red-400 hover:text-red-600 text-[12px] font-medium flex items-center gap-1"
                        >
                            Gerenciar produtos <ArrowUpRight size={14} />
                        </button>
                    </div>
                    <div className="divide-y divide-stone-50">
                        {stockAlerts.map((alert) => {
                            const alertMeta = {
                                expired:   { label: 'Vencido',         color: 'text-red-700 bg-red-100',      icon: <CalendarX2 size={13} /> },
                                expiring:  { label: 'Vencendo',        color: 'text-orange-700 bg-orange-100', icon: <CalendarX2 size={13} /> },
                                reorder:   { label: 'Repor Estoque',   color: 'text-amber-700 bg-amber-100',  icon: <ShoppingCart size={13} /> },
                                low_stock: { label: 'Estoque Baixo',   color: 'text-yellow-700 bg-yellow-100', icon: <Package size={13} /> },
                            }[alert.alertType];
                            return (
                                <div key={alert.id} className="px-5 py-3 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${alertMeta.color}`}>
                                            {alertMeta.icon} {alertMeta.label}
                                        </span>
                                        <span className="text-[13px] text-stone-700 truncate">{alert.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0 text-[12px] text-stone-400">
                                        {alert.warehouseLocation && (
                                            <span className="flex items-center gap-1 hidden sm:flex">
                                                <MapPin size={12} /> {alert.warehouseLocation}
                                            </span>
                                        )}
                                        {alert.expiryDate && (
                                            <span>Val: {new Date(alert.expiryDate).toLocaleDateString('pt-BR')}</span>
                                        )}
                                        <span className={`font-semibold ${alert.stock <= 0 ? 'text-red-600' : 'text-stone-600'}`}>
                                            {alert.stock} un.
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Orders Table */}
            <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-50 flex items-center justify-between">
                    <h2 className="text-[14px] font-medium text-stone-700">Pedidos Recentes</h2>
                    <button
                        onClick={() => onNavigate('ORDERS')}
                        className="text-stone-400 hover:text-stone-600 text-[12px] font-medium flex items-center gap-1"
                    >
                        Ver todos <ArrowUpRight size={14} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-stone-25">
                            <tr className="border-b border-stone-50">
                                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Pedido</th>
                                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Cliente</th>
                                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Total</th>
                                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Status</th>
                                <th className="text-right px-4 py-2.5 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((order) => (
                                <RecentOrderRow key={order.id} {...order} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

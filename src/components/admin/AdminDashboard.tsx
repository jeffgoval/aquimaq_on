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
    RotateCcw
} from 'lucide-react';
import {
    getDashboardStats,
    restoreStockFromUnpaidOrders,
} from '@/services/adminService';

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
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalClientes: 0,
    });
    const [recentOrders, setRecentOrders] = useState<RecentOrderProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoreStockLoading, setRestoreStockLoading] = useState(false);
    const [restoreStockMessage, setRestoreStockMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const { stats: nextStats, recentOrders: nextRecent } = await getDashboardStats();
                setStats(nextStats);
                setRecentOrders(nextRecent);
            } catch (e) {
                console.error('AdminDashboard load:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto">
                <h1 className="text-xl font-semibold text-stone-800">Dashboard</h1>
                <p className="text-stone-400 text-[13px] mt-0.5">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-xl font-semibold text-stone-800">Dashboard</h1>
                <p className="text-stone-400 text-[13px] mt-0.5">Visão geral do seu negócio</p>
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
            </div>

            {/* Restaurar estoque de pedidos não pagos */}
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

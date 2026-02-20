import React, { useEffect, useState } from 'react';
import { BarChart, DollarSign, ShoppingCart, TrendingUp, Package, RefreshCw } from 'lucide-react';
import {
    getSalesSummary,
    getDailySales,
    getProductRanking,
    type SalesSummary,
    type DailySale,
    type ProductRank,
} from '@/services/adminService';

const PERIODS = [
    { label: '7 dias', days: 7 },
    { label: '30 dias', days: 30 },
    { label: '90 dias', days: 90 },
];

const AdminAnalytics: React.FC = () => {
    const [period, setPeriod] = useState(30);
    const [loading, setLoading] = useState(true);
    const [sales, setSales] = useState<SalesSummary | null>(null);
    const [dailySales, setDailySales] = useState<DailySale[]>([]);
    const [topProducts, setTopProducts] = useState<ProductRank[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [salesData, dailyData, productsData] = await Promise.all([
                getSalesSummary(period),
                getDailySales(period),
                getProductRanking(10),
            ]);

            if (salesData) setSales(salesData);
            setDailySales(dailyData || []);
            setTopProducts(productsData || []);
        } catch (err) {
            console.error('Analytics load error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [period]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const maxRevenue = Math.max(...dailySales.map(d => d.revenue), 1);

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart className="w-7 h-7 text-indigo-600" />
                        Analytics
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Visão geral do desempenho da loja</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        {PERIODS.map(p => (
                            <button
                                key={p.days}
                                onClick={() => setPeriod(p.days)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${period === p.days
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {loading && !sales ? (
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard
                            icon={<DollarSign className="w-5 h-5" />}
                            label="Receita Total"
                            value={formatCurrency(sales?.total_revenue || 0)}
                            detail={`Hoje: ${formatCurrency(sales?.revenue_today || 0)}`}
                            color="emerald"
                        />
                        <KPICard
                            icon={<ShoppingCart className="w-5 h-5" />}
                            label="Pedidos"
                            value={String(sales?.total_orders || 0)}
                            detail={`Hoje: ${sales?.orders_today || 0} | Pagos: ${sales?.paid_orders || 0}`}
                            color="blue"
                        />
                        <KPICard
                            icon={<TrendingUp className="w-5 h-5" />}
                            label="Ticket Médio"
                            value={formatCurrency(sales?.avg_ticket || 0)}
                            detail={`Pendentes: ${sales?.pending_orders || 0} | Cancelados: ${sales?.cancelled_orders || 0}`}
                            color="purple"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 gap-6">
                        {/* Daily Sales Chart */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                Vendas Diárias
                            </h3>
                            <div className="flex items-end gap-[2px] h-48">
                                {dailySales.map((day, i) => {
                                    const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 group relative"
                                            title={`${new Date(day.date).toLocaleDateString('pt-BR')} — ${formatCurrency(day.revenue)} (${day.orders} pedidos)`}
                                        >
                                            <div
                                                className="bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-sm hover:from-indigo-600 hover:to-indigo-500 transition-all cursor-pointer min-h-[2px]"
                                                style={{ height: `${Math.max(height, 1)}%` }}
                                            />
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                                    <p className="font-medium">{new Date(day.date).toLocaleDateString('pt-BR')}</p>
                                                    <p>{formatCurrency(day.revenue)}</p>
                                                    <p>{day.orders} pedido(s)</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-400">
                                <span>{dailySales[0] ? new Date(dailySales[0].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}</span>
                                <span>{dailySales.length > 0 ? new Date(dailySales[dailySales.length - 1].date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-500" />
                            Top Produtos
                        </h3>
                        {topProducts.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">Nenhuma venda registrada no período</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500 border-b border-gray-100">
                                            <th className="pb-3 font-medium">#</th>
                                            <th className="pb-3 font-medium">Produto</th>
                                            <th className="pb-3 font-medium text-right">Vendidos</th>
                                            <th className="pb-3 font-medium text-right">Receita</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topProducts.map((product, i) => (
                                            <tr key={product.product_id} className="border-b border-gray-50 hover:bg-gray-50">
                                                <td className="py-3">
                                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                        i === 1 ? 'bg-gray-100 text-gray-600' :
                                                            i === 2 ? 'bg-orange-100 text-orange-600' :
                                                                'bg-gray-50 text-gray-400'
                                                        }`}>
                                                        {i + 1}
                                                    </span>
                                                </td>
                                                <td className="py-3 font-medium text-gray-900">{product.product_name}</td>
                                                <td className="py-3 text-right text-gray-600">{product.total_sold}</td>
                                                <td className="py-3 text-right font-semibold text-emerald-600">{formatCurrency(product.total_revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface KPICardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    detail: string;
    color: 'emerald' | 'blue' | 'purple';
}

const colorMap = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
};

const KPICard: React.FC<KPICardProps> = ({ icon, label, value, detail, color }) => {
    const c = colorMap[color];
    return (
        <div className={`${c.bg} rounded-xl p-5 border border-${color}-100/50`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">{label}</span>
                <div className={`${c.icon} p-2 rounded-lg ${c.text}`}>{icon}</div>
            </div>
            <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{detail}</p>
        </div>
    );
};

export default AdminAnalytics;


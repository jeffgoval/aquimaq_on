import React, { useState, useEffect } from 'react';
import {
    ShoppingBag,
    Search,
    Clock,
    CheckCircle2,
    Package,
    Truck,
    XCircle,
    ChevronDown,
    Eye,
    RefreshCw,
    X
} from 'lucide-react';
import { getOrdersAdmin, updateOrderStatus } from '@/services/adminService';
import type { OrderAdminRow } from '@/services/adminService';
import { OrderStatus } from '@/types';

interface PedidoComCliente extends OrderAdminRow {
    status: OrderStatus;
}

const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'aguardando_pagamento', label: 'Aguardando Pagamento' },
    { value: 'pago', label: 'Pago' },
    { value: 'em_separacao', label: 'Em Separação' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'pronto_retirada', label: 'Pronto para Retirada' },
    { value: 'entregue', label: 'Entregue' },
    { value: 'cancelado', label: 'Cancelado' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
    'aguardando_pagamento': { label: 'Aguardando', color: 'text-amber-600 bg-amber-50' },
    'pago': { label: 'Pago', color: 'text-emerald-600 bg-emerald-50' },
    'em_separacao': { label: 'Separando', color: 'text-blue-600 bg-blue-50' },
    'enviado': { label: 'Enviado', color: 'text-violet-600 bg-violet-50' },
    'pronto_retirada': { label: 'Retirada', color: 'text-indigo-600 bg-indigo-50' },
    'entregue': { label: 'Entregue', color: 'text-emerald-600 bg-emerald-50' },
    'cancelado': { label: 'Cancelado', color: 'text-stone-500 bg-stone-100' },
};

const AdminOrdersManagement: React.FC = () => {
    const [orders, setOrders] = useState<PedidoComCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<PedidoComCliente | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await getOrdersAdmin();
            setOrders(data as PedidoComCliente[]);
        } catch (error) {
            if (import.meta.env.DEV) console.error('Error loading orders:', error);
            setMessage({ type: 'error', text: 'Erro ao carregar pedidos.' });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            setUpdatingOrderId(orderId);
            await updateOrderStatus(orderId, newStatus);

            setOrders(prev => prev.map(order =>
                order.id === orderId ? { ...order, status: newStatus as OrderStatus } : order
            ));
            setMessage({ type: 'success', text: 'Status atualizado.' });
            setTimeout(() => setMessage(null), 2000);
        } catch (error) {
            if (import.meta.env.DEV) console.error('Error updating status:', error);
            setMessage({ type: 'error', text: 'Erro ao atualizar status.' });
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.clientPhone || '').includes(searchQuery);

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-5 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-stone-800">Pedidos</h1>
                    <p className="text-stone-400 text-[13px] mt-0.5">Gerencie todos os pedidos</p>
                </div>
                <button
                    onClick={loadOrders}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors text-[13px] font-medium"
                >
                    <RefreshCw size={14} />
                    Atualizar
                </button>
            </div>

            {/* Feedback */}
            {message && (
                <div className={`px-3 py-2 rounded-lg text-[13px] ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-stone-300" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por ID, cliente ou telefone..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] placeholder-stone-400 focus:outline-none focus:border-stone-300"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="sm:w-48 relative">
                    <select
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] text-stone-600 focus:outline-none focus:border-stone-300 appearance-none cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 text-stone-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500 mb-2"></div>
                        <p className="text-stone-400 text-[13px]">Carregando...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-stone-100">
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Pedido</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Cliente</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Total</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Status</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Data</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-stone-400 text-[13px]">
                                            Nenhum pedido encontrado.
                                        </td>
                                    </tr>
                                ) : filteredOrders.map((order) => {
                                    const config = statusConfig[order.status] || statusConfig['aguardando_pagamento'];
                                    return (
                                        <tr key={order.id} className="hover:bg-stone-25">
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-[12px] text-stone-500">
                                                    #{order.id.slice(-8).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-[13px] text-stone-700">{order.clientName}</p>
                                                    <p className="text-[11px] text-stone-400">{order.clientPhone}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[13px] font-medium text-stone-700">
                                                    {formatCurrency(order.total)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                    disabled={updatingOrderId === order.id}
                                                    className={`
                                                        appearance-none px-2 py-1 rounded text-[11px] font-medium cursor-pointer
                                                        border-0 focus:ring-1 focus:ring-stone-300 focus:outline-none
                                                        ${config.color}
                                                        ${updatingOrderId === order.id ? 'opacity-50' : ''}
                                                    `}
                                                >
                                                    {statusOptions.slice(1).map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[12px] text-stone-400">
                                                    {formatDate(order.createdAt)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                                                    title="Ver detalhes"
                                                    aria-label="Ver detalhes do pedido"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white rounded-xl max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                            <h3 className="font-medium text-stone-800">
                                Pedido #{selectedOrder.id.slice(-8).toUpperCase()}
                            </h3>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-stone-400 hover:text-stone-600 p-1"
                                aria-label="Fechar detalhes do pedido"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-[13px]">
                                <div>
                                    <p className="text-stone-400 text-[11px] uppercase tracking-wide mb-0.5">Cliente</p>
                                    <p className="text-stone-700">{selectedOrder.clientName}</p>
                                </div>
                                <div>
                                    <p className="text-stone-400 text-[11px] uppercase tracking-wide mb-0.5">Telefone</p>
                                    <p className="text-stone-700">{selectedOrder.clientPhone}</p>
                                </div>
                                <div>
                                    <p className="text-stone-400 text-[11px] uppercase tracking-wide mb-0.5">Subtotal</p>
                                    <p className="text-stone-700">{formatCurrency(selectedOrder.subtotal)}</p>
                                </div>
                                <div>
                                    <p className="text-stone-400 text-[11px] uppercase tracking-wide mb-0.5">Frete</p>
                                    <p className="text-stone-700">{formatCurrency(selectedOrder.shippingCost)}</p>
                                </div>
                                <div>
                                    <p className="text-stone-400 text-[11px] uppercase tracking-wide mb-0.5">Total</p>
                                    <p className="text-stone-800 font-semibold">{formatCurrency(selectedOrder.total)}</p>
                                </div>
                                <div>
                                    <p className="text-stone-400 text-[11px] uppercase tracking-wide mb-0.5">Envio</p>
                                    <p className="text-stone-700">{selectedOrder.shippingMethod || 'N/A'}</p>
                                </div>
                            </div>
                            {selectedOrder.trackingCode && (
                                <div className="bg-stone-50 p-3 rounded-lg">
                                    <p className="text-stone-500 text-[11px] uppercase tracking-wide mb-0.5">Rastreio</p>
                                    <p className="font-mono text-stone-700 text-[13px]">{selectedOrder.trackingCode}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrdersManagement;


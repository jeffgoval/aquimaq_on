import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    ShoppingBag,
    Search,
    Package,
    Truck,
    ChevronLeft,
    ChevronRight,
    Eye,
    RefreshCw,
    X,
    Download,
    Printer,
    Store,
} from 'lucide-react';
import {
    getOrdersAdmin,
    updateOrderStatus,
    updateOrderTracking,
    getAdminMePrintUrl,
    type OrderAdminRow
} from '@/services/adminService';
import { OrderStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 20;

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

/** Retorna true quando o pedido é de retirada na loja. */
const isPickupOrder = (order: { shippingMethod?: string | null }) =>
    !!(order.shippingMethod?.toLowerCase().includes('retirada') ||
       order.shippingMethod?.includes('pickup_store'));

/** Opções de status para pedidos de ENTREGA (exclui pronto_retirada). */
const deliveryStatusOptions = statusOptions.slice(1).filter(o => o.value !== 'pronto_retirada');

/** Opções de status para pedidos de RETIRADA (exclui enviado). */
const pickupStatusOptions = statusOptions.slice(1).filter(o => o.value !== 'enviado');

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
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();
    const isVendedor = hasRole(['vendedor']);

    const [orders, setOrders] = useState<PedidoComCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchParams] = useSearchParams();
    const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? 'all');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<PedidoComCliente | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [editingTracking, setEditingTracking] = useState<{ id: string, code: string } | null>(null);
    const [printingLabel, setPrintingLabel] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadOrders();
    }, [isVendedor, user?.id]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            // Removido o filtro por vendedorId temporariamente para que vendedores vejam todos os pedidos da loja
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

    const handleTrackingSave = async () => {
        if (!editingTracking) return;
        try {
            await updateOrderTracking(editingTracking.id, editingTracking.code);
            setOrders(prev => prev.map(o =>
                o.id === editingTracking.id ? { ...o, trackingCode: editingTracking.code } : o
            ));
            setMessage({ type: 'success', text: 'Código de rastreio atualizado.' });
            setTimeout(() => setMessage(null), 2000);

            if (selectedOrder && selectedOrder.id === editingTracking.id) {
                setSelectedOrder({ ...selectedOrder, trackingCode: editingTracking.code });
            }
        } catch (error) {
            if (import.meta.env.DEV) console.error('Error updating tracking:', error);
            setMessage({ type: 'error', text: 'Erro ao atualizar rastreio.' });
        } finally {
            setEditingTracking(null);
        }
    };

    const handlePrintLabel = async (order: PedidoComCliente) => {
        setPrintingLabel(true);
        setMessage({ type: 'success', text: 'Gerando etiqueta...' });
        try {
            navigate(getAdminMePrintUrl(order.id, 'label'));
            setMessage(null);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao gerar etiqueta.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setPrintingLabel(false);
        }
    };

    const handlePrintDocs = async (order: PedidoComCliente) => {
        setPrintingLabel(true);
        setMessage({ type: 'success', text: 'Abrindo documentos...' });
        try {
            navigate(getAdminMePrintUrl(order.id, 'docs'));
            setMessage(null);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao abrir documentos.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setPrintingLabel(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            order.id.toLowerCase().includes(query) ||
            (order.clientName || '').toLowerCase().includes(query) ||
            (order.clientPhone || '').includes(searchQuery) ||
            (order.trackingCode || '').toLowerCase().includes(query);

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pagedOrders = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const handleSearchChange = (value: string) => { setSearchQuery(value); setCurrentPage(1); };
    const handleStatusFilterChange = (value: string) => { setStatusFilter(value); setCurrentPage(1); };

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

    const exportToCSV = () => {
        const header = ['ID', 'Cliente', 'Telefone', 'Status', 'Total (R$)', 'Data', 'Rastreio'];
        const rows = filteredOrders.map(o => [
            o.id,
            o.clientName || '',
            o.clientPhone || '',
            statusConfig[o.status]?.label || o.status,
            o.total.toFixed(2).replace('.', ','),
            new Date(o.createdAt).toLocaleDateString('pt-BR'),
            o.trackingCode || '',
        ]);
        const csv = [header, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-stone-800">Pedidos</h1>
                    <p className="text-xs text-stone-500 mt-0.5">
                        {orders.length} pedido{orders.length !== 1 ? 's' : ''} cadastrado{orders.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {message && (
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {message.text}
                        </span>
                    )}
                    <button
                        onClick={exportToCSV}
                        disabled={filteredOrders.length === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Exportar pedidos filtrados em CSV"
                    >
                        <Download size={14} />
                        Exportar CSV
                    </button>
                    <button
                        onClick={loadOrders}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                        <RefreshCw size={14} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-stone-300" size={15} />
                    <input
                        type="text"
                        placeholder="Buscar por ID, cliente ou telefone..."
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
                <div className="sm:w-52">
                    <select
                        className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-300"
                        value={statusFilter}
                        onChange={(e) => handleStatusFilterChange(e.target.value)}
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                {loading ? (
                    <div className="py-16 flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-stone-100">
                                    <th className="px-4 py-2 text-xs font-medium text-stone-400 min-w-[180px]">Pedido</th>
                                    <th className="px-4 py-2 text-xs font-medium text-stone-400 w-px whitespace-nowrap">Cliente</th>
                                    <th className="px-4 py-2 text-xs font-medium text-stone-400 w-px whitespace-nowrap">Total</th>
                                    <th className="px-4 py-2 text-xs font-medium text-stone-400 w-px whitespace-nowrap">Status</th>
                                    <th className="px-4 py-2 text-xs font-medium text-stone-400 w-px whitespace-nowrap">Data</th>
                                    <th className="px-4 py-2 text-xs font-medium text-stone-400 w-px whitespace-nowrap text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-stone-400">
                                            Nenhum pedido encontrado.
                                        </td>
                                    </tr>
                                ) : pagedOrders.map((order) => {
                                    const config = statusConfig[order.status] || statusConfig['aguardando_pagamento'];
                                    return (
                                        <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-4 py-1.5 min-w-[180px] align-middle">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs text-stone-600">
                                                        #{order.id.slice(-8).toUpperCase()}
                                                    </span>
                                                    {isPickupOrder(order) && (
                                                        <span className="inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-medium rounded-full border border-indigo-100">
                                                            <Store size={10} /> Retirada
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-1.5 align-middle w-px whitespace-nowrap">
                                                <div>
                                                    <p className="text-sm text-stone-700">{order.clientName}</p>
                                                    <p className="text-xs text-stone-400">{order.clientPhone}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-1.5 align-middle w-px whitespace-nowrap">
                                                <span className="text-sm font-medium text-stone-700">
                                                    {formatCurrency(order.total)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-1.5 align-middle w-px whitespace-nowrap">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                    disabled={updatingOrderId === order.id}
                                                    className={`appearance-none px-2 py-1 rounded text-[11px] font-medium cursor-pointer border-0 focus:ring-1 focus:ring-stone-300 focus:outline-none ${config.color} ${updatingOrderId === order.id ? 'opacity-50' : ''}`}
                                                >
                                                    {(isPickupOrder(order) ? pickupStatusOptions : deliveryStatusOptions).map(option => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-1.5 align-middle w-px whitespace-nowrap">
                                                <span className="text-xs text-stone-500">{formatDate(order.createdAt)}</span>
                                            </td>
                                            <td className="px-4 py-1.5 text-right align-middle w-px whitespace-nowrap">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                                                    title="Ver detalhes"
                                                    aria-label="Ver detalhes do pedido"
                                                >
                                                    <Eye size={12} />
                                                    Ver
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

            {/* Pagination */}
            {!loading && filteredOrders.length > PAGE_SIZE && (
                <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>
                        {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''} — página {safePage} de {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="Página anterior"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                            .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                                if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, idx) =>
                                p === '...'
                                    ? <span key={`ellipsis-${idx}`} className="px-1">…</span>
                                    : <button
                                        key={p}
                                        onClick={() => setCurrentPage(p as number)}
                                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${safePage === p ? 'bg-stone-900 text-white' : 'hover:bg-stone-100'}`}
                                    >
                                        {p}
                                    </button>
                            )
                        }
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="Próxima página"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

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
                        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">

                            {/* Address / Pickup details */}
                            <div className={`p-4 rounded-xl border ${isPickupOrder(selectedOrder) ? 'bg-indigo-50 border-indigo-100' : 'bg-stone-50 border-stone-100'}`}>
                                {isPickupOrder(selectedOrder) ? (
                                    <>
                                        <h4 className="text-[12px] font-medium text-indigo-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                            <Store size={14} /> Retirada na Loja
                                        </h4>
                                        <p className="text-indigo-600 text-[13px]">Cliente retira no balcão.</p>
                                    </>
                                ) : (
                                    <>
                                        <h4 className="text-[12px] font-medium text-stone-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                                            <Truck size={14} /> Endereço de Entrega
                                        </h4>
                                        <p className="text-stone-600 text-[13px]">{selectedOrder.clientAddress}</p>
                                    </>
                                )}
                            </div>

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
                                    <p className="text-stone-700">{selectedOrder.shippingMethodLabel ?? selectedOrder.shippingMethod ?? 'N/A'}</p>
                                </div>
                            </div>

                            {/* Tracking code Editor */}
                            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                                <h4 className="text-[12px] font-medium text-stone-700 uppercase tracking-wide mb-2 flex items-center gap-2"><Package size={14} /> Código de Rastreio</h4>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={editingTracking?.id === selectedOrder.id ? editingTracking.code : (selectedOrder.trackingCode || '')}
                                        onChange={e => setEditingTracking({ id: selectedOrder.id, code: e.target.value })}
                                        placeholder="Ex: BR123456789BR"
                                        className="flex-1 px-3 py-2 text-sm border border-stone-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                                    />
                                    <button
                                        onClick={handleTrackingSave}
                                        disabled={!editingTracking || editingTracking.id !== selectedOrder.id || editingTracking.code === selectedOrder.trackingCode}
                                        className="px-4 py-2 bg-stone-800 text-white rounded-lg text-[13px] font-medium hover:bg-stone-700 disabled:opacity-50"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </div>

                            {/* Imprimir Etiqueta Melhor Envios */}
                            {selectedOrder.meOrderId && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handlePrintLabel(selectedOrder)}
                                        disabled={printingLabel}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[13px] font-medium transition-colors"
                                        title="Imprimir etiqueta térmica 10×15 (recomendado)"
                                    >
                                        <Printer size={15} />
                                        {printingLabel ? 'Abrindo...' : 'Etiqueta 10×15'}
                                    </button>

                                    <button
                                        onClick={() => handlePrintDocs(selectedOrder)}
                                        disabled={printingLabel}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed text-stone-800 border border-stone-200 rounded-xl text-[13px] font-medium transition-colors"
                                        title="Abrir página/URL de impressão (pode conter comprovantes/documentos)"
                                    >
                                        <Printer size={15} />
                                        Docs (A4)
                                    </button>
                                </div>
                            )}

                            {/* Items list */}
                            <div>
                                <h4 className="text-[12px] font-medium text-stone-700 uppercase tracking-wide mb-3 flex items-center gap-2"><ShoppingBag size={14} /> Itens do Pedido</h4>
                                <div className="space-y-3 bg-white border border-stone-100 rounded-xl p-4">
                                    {selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center pb-3 border-b border-stone-100 last:border-0 last:pb-0">
                                            <div>
                                                <p className="text-[13px] text-stone-700 font-medium">{item.productName}</p>
                                                <p className="text-[12px] text-stone-500 mt-0.5">{item.quantity}x {formatCurrency(item.unitPrice)}</p>
                                            </div>
                                            <p className="text-[13px] font-medium text-stone-800">{formatCurrency(item.quantity * item.unitPrice)}</p>
                                        </div>
                                    )) : (
                                        <p className="text-stone-500 text-[13px] text-center py-2">Nenhum item encontrado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrdersManagement;


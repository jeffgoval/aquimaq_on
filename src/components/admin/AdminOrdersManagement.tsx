import React, { useState, useEffect, useRef } from 'react';
import {
    ShoppingBag,
    Search,
    Package,
    Truck,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    RefreshCw,
    X,
    Download,
    Printer,
    CheckSquare,
    Square,
    ClipboardList,
} from 'lucide-react';
import {
    getOrdersAdmin,
    updateOrderStatus,
    updateOrderStatusBulk,
    updateOrderTracking,
    printMelhorEnviosLabel,
    type OrderAdminRow,
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
    { value: 'em_separacao', label: 'Em SeparaÃ§Ã£o' },
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

const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

/** Abre o romaneio de separaÃ§Ã£o numa nova janela e dispara impressÃ£o. */
const printRomaneio = (orders: PedidoComCliente[]) => {
    const em = orders.filter(o => o.status === 'em_separacao');
    if (em.length === 0) { alert('Nenhum pedido em separaÃ§Ã£o no momento.'); return; }

    const rows = em.map(o => `
    <div class="pedido">
      <div class="pedido-header">
        <span class="pedido-id">#${o.id.slice(-8).toUpperCase()}</span>
        <span class="pedido-cliente">${o.clientName}</span>
        <span class="pedido-fone">${o.clientPhone || 'â€”'}</span>
      </div>
      <div class="pedido-end">${o.clientAddress}</div>
      <div class="pedido-frete">${o.shippingMethod || 'Retirada'}</div>
      <table class="itens">
        <thead><tr><th>Produto</th><th>Qtd</th><th>Unit.</th></tr></thead>
        <tbody>
          ${(o.items || []).map(i => `
          <tr>
            <td>${i.productName}</td>
            <td>${i.quantity}</td>
            <td>${fmtCurrency(i.unitPrice)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="pedido-total">Total: ${fmtCurrency(o.total)}</div>
    </div>`).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Romaneio de SeparaÃ§Ã£o</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #111; }
    h1 { font-size: 16px; margin-bottom: 4px; }
    .meta { color: #555; font-size: 11px; margin-bottom: 16px; }
    .pedido { border: 1px solid #ccc; border-radius: 6px; padding: 12px; margin-bottom: 14px; page-break-inside: avoid; }
    .pedido-header { display: flex; gap: 12px; font-weight: bold; margin-bottom: 4px; }
    .pedido-id { color: #444; font-family: monospace; }
    .pedido-end, .pedido-frete { font-size: 11px; color: #555; margin-bottom: 2px; }
    .itens { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .itens th { text-align: left; border-bottom: 1px solid #ddd; padding: 3px 4px; font-size: 11px; }
    .itens td { padding: 3px 4px; border-bottom: 1px solid #f0f0f0; }
    .pedido-total { text-align: right; font-weight: bold; margin-top: 6px; }
    @media print { body { margin: 10px; } }
  </style>
</head>
<body>
  <h1>Romaneio de SeparaÃ§Ã£o</h1>
  <div class="meta">${new Date().toLocaleString('pt-BR')} â€” ${em.length} pedido${em.length !== 1 ? 's' : ''}</div>
  ${rows}
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
};

const AdminOrdersManagement: React.FC = () => {
    const { user, hasRole } = useAuth();
    const isVendedor = hasRole(['vendedor']);

    const [orders, setOrders] = useState<PedidoComCliente[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<PedidoComCliente | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [editingTracking, setEditingTracking] = useState<{ id: string; code: string } | null>(null);
    const [printingLabel, setPrintingLabel] = useState(false);

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = useState('em_separacao');
    const [bulkUpdating, setBulkUpdating] = useState(false);

    // Debounce search
    const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (searchRef.current) clearTimeout(searchRef.current);
        searchRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => { if (searchRef.current) clearTimeout(searchRef.current); };
    }, [searchQuery]);

    // Reset page + selection when filters change
    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds(new Set());
    }, [debouncedSearch, statusFilter]);

    // Load orders when any server-side param changes
    useEffect(() => {
        loadOrders();
    }, [isVendedor, user?.id, currentPage, debouncedSearch, statusFilter]);

    // When searching, load all matching records (client-side filter applied below)
    const isSearching = debouncedSearch.trim().length > 0;

    const loadOrders = async () => {
        try {
            setLoading(true);
            const vendedorId = isVendedor ? user?.id : undefined;
            // When searching: load all records for the current status (unlimited),
            // then apply client-side name/phone search below.
            // When browsing: server-side pagination.
            const unlimited = isSearching || (statusFilter !== 'all');
            const { orders: data, total: t } = await getOrdersAdmin({
                vendedorId,
                page: currentPage,
                pageSize: PAGE_SIZE,
                status: statusFilter,
                unlimited,
            });
            setOrders(data as PedidoComCliente[]);
            setTotal(t);
        } catch (error) {
            if (import.meta.env.DEV) console.error('Error loading orders:', error);
            setMessage({ type: 'error', text: 'Erro ao carregar pedidos.' });
        } finally {
            setLoading(false);
        }
    };

    // Client-side search within loaded records
    const filteredOrders: PedidoComCliente[] = isSearching
        ? orders.filter(o => {
            const q = debouncedSearch.toLowerCase();
            return (
                o.id.toLowerCase().includes(q) ||
                (o.clientName || '').toLowerCase().includes(q) ||
                (o.clientPhone || '').includes(debouncedSearch) ||
                (o.trackingCode || '').toLowerCase().includes(q)
            );
        })
        : orders;

    // Pagination
    const displayTotal = isSearching ? filteredOrders.length : total;
    const totalPages = Math.max(1, Math.ceil(
        isSearching
            ? filteredOrders.length / PAGE_SIZE
            : total / PAGE_SIZE
    ));
    const safePage = Math.min(currentPage, totalPages);
    const pagedOrders = isSearching
        ? filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
        : filteredOrders; // already paginated server-side

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            setUpdatingOrderId(orderId);
            await updateOrderStatus(orderId, newStatus);
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o
            ));
            setMessage({ type: 'success', text: 'Status atualizado.' });
            setTimeout(() => setMessage(null), 2000);
        } catch (error) {
            if (import.meta.env.DEV) console.error(error);
            setMessage({ type: 'error', text: 'Erro ao atualizar status.' });
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleBulkStatusChange = async () => {
        if (selectedIds.size === 0 || bulkUpdating) return;
        try {
            setBulkUpdating(true);
            const ids = Array.from(selectedIds);
            await updateOrderStatusBulk(ids, bulkStatus);
            setOrders(prev => prev.map(o =>
                selectedIds.has(o.id) ? { ...o, status: bulkStatus as OrderStatus } : o
            ));
            setSelectedIds(new Set());
            setMessage({ type: 'success', text: `${ids.length} pedido${ids.length !== 1 ? 's' : ''} atualizados.` });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            if (import.meta.env.DEV) console.error(error);
            setMessage({ type: 'error', text: 'Erro ao atualizar pedidos.' });
        } finally {
            setBulkUpdating(false);
        }
    };

    const handleTrackingSave = async () => {
        if (!editingTracking) return;
        try {
            await updateOrderTracking(editingTracking.id, editingTracking.code);
            setOrders(prev => prev.map(o =>
                o.id === editingTracking.id ? { ...o, trackingCode: editingTracking.code } : o
            ));
            setMessage({ type: 'success', text: 'CÃ³digo de rastreio atualizado.' });
            setTimeout(() => setMessage(null), 2000);
            if (selectedOrder?.id === editingTracking.id) {
                setSelectedOrder({ ...selectedOrder, trackingCode: editingTracking.code });
            }
        } catch (error) {
            if (import.meta.env.DEV) console.error(error);
            setMessage({ type: 'error', text: 'Erro ao atualizar rastreio.' });
        } finally {
            setEditingTracking(null);
        }
    };

    const handlePrintLabel = async (order: PedidoComCliente) => {
        setPrintingLabel(true);
        setMessage({ type: 'success', text: 'Gerando etiqueta...' });
        try {
            const url = await printMelhorEnviosLabel(order.id);
            window.open(url, '_blank');
            setMessage(null);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao gerar etiqueta.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setPrintingLabel(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === pagedOrders.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pagedOrders.map(o => o.id)));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const exportToCSV = () => {
        const src = isSearching ? filteredOrders : orders;
        const header = ['ID', 'Cliente', 'Telefone', 'Status', 'Total (R$)', 'Data', 'Rastreio'];
        const rows = src.map(o => [
            o.id,
            o.clientName || '',
            o.clientPhone || '',
            statusConfig[o.status]?.label || o.status,
            o.total.toFixed(2).replace('.', ','),
            new Date(o.createdAt).toLocaleDateString('pt-BR'),
            o.trackingCode || '',
        ]);
        const csv = [header, ...rows]
            .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
            .join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const allPageSelected = pagedOrders.length > 0 && pagedOrders.every(o => selectedIds.has(o.id));

    return (
        <div className="space-y-5 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-stone-800">Pedidos</h1>
                    <p className="text-stone-400 text-[13px] mt-0.5">Gerencie todos os pedidos</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => printRomaneio(orders)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors text-[13px] font-medium"
                        title="Imprimir romaneio de pedidos em separaÃ§Ã£o"
                    >
                        <ClipboardList size={14} />
                        Romaneio
                    </button>
                    <button
                        onClick={exportToCSV}
                        disabled={orders.length === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Exportar pedidos filtrados em CSV"
                    >
                        <Download size={14} />
                        Exportar CSV
                    </button>
                    <button
                        onClick={loadOrders}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors text-[13px] font-medium"
                    >
                        <RefreshCw size={14} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Feedback */}
            {message && (
                <div className={`px-3 py-2 rounded-lg text-[13px] ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-stone-300" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por ID, cliente, telefone ou rastreio..."
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
                        {statusOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 text-stone-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 bg-stone-800 text-white px-4 py-2.5 rounded-xl text-[13px]">
                    <span className="font-medium">{selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}</span>
                    <span className="text-stone-400">â†’</span>
                    <select
                        value={bulkStatus}
                        onChange={e => setBulkStatus(e.target.value)}
                        className="bg-stone-700 border border-stone-600 rounded-lg px-2 py-1 text-white text-[12px] focus:outline-none cursor-pointer"
                    >
                        {statusOptions.slice(1).map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleBulkStatusChange}
                        disabled={bulkUpdating}
                        className="bg-white text-stone-800 px-3 py-1 rounded-lg text-[12px] font-semibold hover:bg-stone-100 disabled:opacity-50 transition-colors"
                    >
                        {bulkUpdating ? 'Atualizando...' : 'Aplicar'}
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="ml-auto text-stone-400 hover:text-white p-1"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

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
                                    <th className="px-3 py-3 w-8">
                                        <button onClick={toggleSelectAll} className="text-stone-400 hover:text-stone-600">
                                            {allPageSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Pedido</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Cliente</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Total</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Status</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Data</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide text-right">AÃ§Ãµes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {pagedOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-stone-400 text-[13px]">
                                            Nenhum pedido encontrado.
                                        </td>
                                    </tr>
                                ) : pagedOrders.map((order) => {
                                    const config = statusConfig[order.status] || statusConfig['aguardando_pagamento'];
                                    const isSelected = selectedIds.has(order.id);
                                    return (
                                        <tr key={order.id} className={`${isSelected ? 'bg-stone-50' : 'hover:bg-stone-25'}`}>
                                            <td className="px-3 py-3">
                                                <button onClick={() => toggleSelect(order.id)} className="text-stone-400 hover:text-stone-600">
                                                    {isSelected ? <CheckSquare size={16} className="text-stone-700" /> : <Square size={16} />}
                                                </button>
                                            </td>
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
                                                <span className="text-[13px] font-medium text-stone-700">{fmtCurrency(order.total)}</span>
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
                                                    {statusOptions.slice(1).map(o => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[12px] text-stone-400">{fmtDate(order.createdAt)}</span>
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

            {/* Pagination */}
            {!loading && displayTotal > PAGE_SIZE && (
                <div className="flex items-center justify-between text-[13px] text-stone-500">
                    <span>
                        {displayTotal} pedido{displayTotal !== 1 ? 's' : ''} â€”
                        pÃ¡gina {safePage} de {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="PÃ¡gina anterior"
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
                                    ? <span key={`e-${idx}`} className="px-1">â€¦</span>
                                    : <button
                                        key={p}
                                        onClick={() => setCurrentPage(p as number)}
                                        className={`w-7 h-7 rounded-lg text-[12px] font-medium transition-colors ${safePage === p ? 'bg-stone-800 text-white' : 'hover:bg-stone-100'}`}
                                    >
                                        {p}
                                    </button>
                            )
                        }
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="PrÃ³xima pÃ¡gina"
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
                                aria-label="Fechar"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                                <h4 className="text-[12px] font-medium text-stone-700 uppercase tracking-wide mb-2 flex items-center gap-2"><Truck size={14} /> EndereÃ§o de Entrega</h4>
                                <p className="text-stone-600 text-[13px]">{selectedOrder.clientAddress}</p>
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
                                    <p className="text-stone-700">{fmtCurrency(selectedOrder.subtotal)}</p>
                                </div>
                                <div>
                                    <p className="text-stone-400 text-[11px] uppercase tracking-wide mb-0.5">Frete</p>
                                    <p className="text-stone-700">{fmtCurrency(selectedOrder.shippingCost)}</p>
                                </div>
                                <div>
                                    <p className="text-stone-400 text-[11px] uppercase tracking-wide mb-0.5">Total</p>
                                    <p className="text-stone-800 font-semibold">{fmtCurrency(selectedOrder.total)}</p>
                                </div>
                                <div>
                                    <p className="text-stone-400 text-[11px] uppercase tracking-wide mb-0.5">Envio</p>
                                    <p className="text-stone-700">{selectedOrder.shippingMethod || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                                <h4 className="text-[12px] font-medium text-stone-700 uppercase tracking-wide mb-2 flex items-center gap-2"><Package size={14} /> CÃ³digo de Rastreio</h4>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={editingTracking?.id === selectedOrder.id ? editingTracking.code : (selectedOrder.trackingCode || '')}
                                        onChange={e => setEditingTracking({ id: selectedOrder.id, code: e.target.value })}
                                        placeholder="Ex: BR123456789BR"
                                        className="flex-1 px-3 py-2 border border-stone-200 bg-white rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
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

                            {selectedOrder.meOrderId && (
                                <button
                                    onClick={() => handlePrintLabel(selectedOrder)}
                                    disabled={printingLabel}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[13px] font-medium transition-colors"
                                >
                                    <Printer size={15} />
                                    {printingLabel ? 'Gerando etiqueta...' : 'Imprimir Etiqueta TÃ©rmica (10Ã—15)'}
                                </button>
                            )}

                            <div>
                                <h4 className="text-[12px] font-medium text-stone-700 uppercase tracking-wide mb-3 flex items-center gap-2"><ShoppingBag size={14} /> Itens do Pedido</h4>
                                <div className="space-y-3 bg-white border border-stone-100 rounded-xl p-4">
                                    {selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center pb-3 border-b border-stone-100 last:border-0 last:pb-0">
                                            <div>
                                                <p className="text-[13px] text-stone-700 font-medium">{item.productName}</p>
                                                <p className="text-[12px] text-stone-500 mt-0.5">{item.quantity}x {fmtCurrency(item.unitPrice)}</p>
                                            </div>
                                            <p className="text-[13px] font-medium text-stone-800">{fmtCurrency(item.quantity * item.unitPrice)}</p>
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

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    getOrdersAdmin,
    updateOrderStatus,
    updateOrderTracking,
    getAdminMePrintUrl,
    tryOpenMelhorEnviosLabelTab,
    syncOrderTrackingFromMelhorEnvios,
    type OrderAdminRow,
} from '@/services/adminService';
import { OrderStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatShortDate } from '@/utils/format';
import { ORDER_STATUS_CONFIG } from '@/constants/orderStatus';
import { OrderFilters } from './orders/OrderFilters';
import { OrdersTable } from './orders/OrdersTable';
import { OrdersPagination } from './orders/OrdersPagination';
import { OrderDetailPanel } from './orders/OrderDetailPanel';

const PAGE_SIZE = 20;

interface PedidoComCliente extends OrderAdminRow {
    status: OrderStatus;
}

const AdminOrdersManagement: React.FC = () => {
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();
    const isVendedor = hasRole(['vendedor']);
    const [searchParams] = useSearchParams();

    // ── State ────────────────────────────────────────────────────────────
    const [orders, setOrders] = useState<PedidoComCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? 'all');
    const [currentPage, setCurrentPage] = useState(1);

    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<PedidoComCliente | null>(null);
    const [printingLabel, setPrintingLabel] = useState(false);
    const [syncingTracking, setSyncingTracking] = useState(false);

    // ── Data ─────────────────────────────────────────────────────────────
    useEffect(() => { loadOrders(); }, [isVendedor, user?.id]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await getOrdersAdmin();
            setOrders(data as PedidoComCliente[]);
        } catch {
            flash('error', 'Erro ao carregar pedidos.');
        } finally {
            setLoading(false);
        }
    };

    // ── Helpers ──────────────────────────────────────────────────────────
    const flash = (type: 'success' | 'error', text: string, autoDismiss = true) => {
        setMessage({ type, text });
        if (autoDismiss) setTimeout(() => setMessage(null), 2500);
    };

    // ── Handlers ─────────────────────────────────────────────────────────
    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdatingOrderId(orderId);
        try {
            await updateOrderStatus(orderId, newStatus);
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o
            ));
            flash('success', 'Status atualizado.');
        } catch {
            flash('error', 'Erro ao atualizar status.');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleSaveTracking = async (orderId: string, code: string) => {
        try {
            await updateOrderTracking(orderId, code);
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, trackingCode: code } : o
            ));
            setSelectedOrder(prev => prev?.id === orderId ? { ...prev, trackingCode: code } : prev);
            flash('success', 'Código de rastreio atualizado.');
        } catch {
            flash('error', 'Erro ao atualizar rastreio.');
        }
    };

    const handleSyncTracking = async () => {
        if (!selectedOrder) return;
        setSyncingTracking(true);
        flash('success', 'Buscando rastreio no Melhor Envios…', false);
        try {
            const { trackingCode } = await syncOrderTrackingFromMelhorEnvios(selectedOrder.id);
            if (!trackingCode) {
                flash('error', 'Ainda não há código de rastreio no Melhor Envios.');
                return;
            }
            setOrders(prev => prev.map(o =>
                o.id === selectedOrder.id ? { ...o, trackingCode } : o
            ));
            setSelectedOrder(prev => prev ? { ...prev, trackingCode } : prev);
            flash('success', 'Rastreio sincronizado.');
        } catch (err) {
            flash('error', err instanceof Error ? err.message : 'Erro ao buscar rastreio.');
        } finally {
            setSyncingTracking(false);
        }
    };

    const handlePrintLabel = async (order: PedidoComCliente) => {
        setPrintingLabel(true);
        tryOpenMelhorEnviosLabelTab(order.id);
        setSelectedOrder(null);
        try {
            await loadOrders();
        } catch (err) {
            flash('error', err instanceof Error ? err.message : 'Erro ao recarregar pedidos.');
        } finally {
            setPrintingLabel(false);
        }
    };

    const handlePrintDocs = (order: PedidoComCliente) => {
        navigate(getAdminMePrintUrl(order.id, 'docs'));
    };

    const handleExportCSV = () => {
        const header = ['ID', 'Cliente', 'Telefone', 'Status', 'Total (R$)', 'Data', 'Rastreio'];
        const rows = filteredOrders.map(o => [
            o.id,
            o.clientName ?? '',
            o.clientPhone ?? '',
            ORDER_STATUS_CONFIG[o.status]?.label ?? o.status,
            o.total.toFixed(2).replace('.', ','),
            formatShortDate(o.createdAt),
            o.trackingCode ?? '',
        ]);
        const csv = [header, ...rows]
            .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
            .join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Derived state ─────────────────────────────────────────────────────
    const filteredOrders = orders.filter(order => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            order.id.toLowerCase().includes(q) ||
            (order.clientName ?? '').toLowerCase().includes(q) ||
            (order.clientPhone ?? '').includes(searchQuery) ||
            (order.trackingCode ?? '').toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pagedOrders = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

            <OrderFilters
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                onSearchChange={v => { setSearchQuery(v); setCurrentPage(1); }}
                onStatusFilterChange={v => { setStatusFilter(v); setCurrentPage(1); }}
                onExportCSV={handleExportCSV}
                onRefresh={loadOrders}
                exportDisabled={filteredOrders.length === 0}
                orderCount={orders.length}
                message={message}
            />

            <OrdersTable
                orders={pagedOrders}
                loading={loading}
                updatingOrderId={updatingOrderId}
                onStatusChange={handleStatusChange}
                onViewOrder={setSelectedOrder}
            />

            {!loading && filteredOrders.length > PAGE_SIZE && (
                <OrdersPagination
                    safePage={safePage}
                    totalPages={totalPages}
                    totalCount={filteredOrders.length}
                    onPageChange={setCurrentPage}
                />
            )}

            {selectedOrder && (
                <OrderDetailPanel
                    order={selectedOrder}
                    printingLabel={printingLabel}
                    syncingTracking={syncingTracking}
                    onClose={() => setSelectedOrder(null)}
                    onPrintLabel={handlePrintLabel}
                    onPrintDocs={handlePrintDocs}
                    onSaveTracking={handleSaveTracking}
                    onSyncTracking={handleSyncTracking}
                />
            )}
        </div>
    );
};

export default AdminOrdersManagement;

import React, { useState } from 'react';
import { X, Store, Truck, Printer } from 'lucide-react';
import { ORDER_STATUS_CONFIG } from '@/constants/orderStatus';
import { formatCurrency, formatDate } from '@/utils/format';
import { maskPhone } from '@/utils/masks';
import type { OrderAdminRow } from '@/services/adminService';
import { OrderStatus } from '@/types';

interface PedidoComCliente extends OrderAdminRow {
    status: OrderStatus;
}

const isPickupOrder = (order: { shippingMethod?: string | null }) =>
    !!(order.shippingMethod?.toLowerCase().includes('retirada') ||
       order.shippingMethod?.includes('pickup_store'));

interface TrackingRowProps {
    orderId: string;
    trackingCode: string | null | undefined;
    meOrderId: string | null | undefined;
    isSyncing: boolean;
    onSave: (orderId: string, code: string) => Promise<void>;
    onSync: () => Promise<void>;
}

const TrackingRow: React.FC<TrackingRowProps> = ({
    orderId, trackingCode, meOrderId, isSyncing, onSave, onSync,
}) => {
    const [draft, setDraft] = useState(trackingCode ?? '');
    const isDirty = draft !== (trackingCode ?? '');

    return (
        <div className="px-5 py-3">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">Rastreamento</p>
            <div className="flex gap-1.5">
                <input
                    type="text"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder="Ex: BR123456789BR"
                    className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-stone-200 bg-stone-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300 focus:bg-white transition-colors font-mono"
                />
                <button
                    onClick={() => onSave(orderId, draft)}
                    disabled={!isDirty}
                    className="px-3 py-1.5 bg-stone-800 text-white rounded-lg text-[12px] font-medium hover:bg-stone-700 disabled:opacity-40 transition-colors shrink-0"
                >
                    Salvar
                </button>
                {meOrderId && (
                    <button
                        onClick={onSync}
                        disabled={isSyncing}
                        className="px-3 py-1.5 bg-white text-stone-600 border border-stone-200 rounded-lg text-[12px] font-medium hover:bg-stone-50 disabled:opacity-40 transition-colors shrink-0"
                        title="Buscar automaticamente no Melhor Envios"
                    >
                        {isSyncing ? '…' : 'Sync ME'}
                    </button>
                )}
            </div>
        </div>
    );
};

interface OrderDetailPanelProps {
    order: PedidoComCliente;
    printingLabel: boolean;
    syncingTracking: boolean;
    onClose: () => void;
    onPrintLabel: (order: PedidoComCliente) => void;
    onPrintDocs: (order: PedidoComCliente) => void;
    onSaveTracking: (orderId: string, code: string) => Promise<void>;
    onSyncTracking: () => Promise<void>;
}

export const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({
    order,
    printingLabel,
    syncingTracking,
    onClose,
    onPrintLabel,
    onPrintDocs,
    onSaveTracking,
    onSyncTracking,
}) => {
    const statusCfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG['aguardando_pagamento'];
    const pickup = isPickupOrder(order);
    const phone = (order.clientPhone ?? '').trim() ? maskPhone(order.clientPhone!) : '—';

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-[440px] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-[15px] font-bold text-stone-900 font-mono">
                                #{order.id.slice(-8).toUpperCase()}
                            </h2>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCfg.color}`}>
                                {statusCfg.shortLabel}
                            </span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">{formatDate(order.createdAt)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                        aria-label="Fechar"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto divide-y divide-stone-100">

                    {/* Cliente */}
                    <div className="px-5 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-stone-500">
                                {(order.clientName ?? 'C')[0].toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-stone-800 truncate">{order.clientName}</p>
                            <p className="text-xs text-stone-400">{phone}</p>
                        </div>
                        {pickup ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg shrink-0">
                                <Store size={10} /> Retirada
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 bg-stone-50 px-2 py-1 rounded-lg shrink-0 max-w-[140px]">
                                <Truck size={10} className="shrink-0" />
                                <span className="truncate">{order.clientAddress?.split(',')[0]}</span>
                            </span>
                        )}
                    </div>

                    {/* Financeiro */}
                    <div className="px-5 py-3 grid grid-cols-3 gap-2">
                        <div className="bg-stone-50 rounded-xl px-3 py-2.5">
                            <p className="text-[10px] text-stone-400 uppercase tracking-wide">Subtotal</p>
                            <p className="text-[13px] font-semibold text-stone-700 mt-0.5">{formatCurrency(order.subtotal)}</p>
                        </div>
                        <div className="bg-stone-50 rounded-xl px-3 py-2.5">
                            <p className="text-[10px] text-stone-400 uppercase tracking-wide truncate" title={order.shippingMethodLabel ?? order.shippingMethod ?? 'Frete'}>
                                {order.shippingMethodLabel ?? order.shippingMethod ?? 'Frete'}
                            </p>
                            <p className="text-[13px] font-semibold text-stone-700 mt-0.5">{formatCurrency(order.shippingCost)}</p>
                        </div>
                        <div className="bg-stone-900 rounded-xl px-3 py-2.5">
                            <p className="text-[10px] text-stone-400 uppercase tracking-wide">Total</p>
                            <p className="text-[13px] font-bold text-white mt-0.5">{formatCurrency(order.total)}</p>
                        </div>
                    </div>

                    {/* Itens */}
                    <div className="px-5 py-3">
                        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-2">
                            {order.items?.length ?? 0} {order.items?.length === 1 ? 'item' : 'itens'}
                        </p>
                        {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-stone-100 text-[10px] font-bold text-stone-500 shrink-0">
                                        {item.quantity}
                                    </span>
                                    <p className="text-[13px] text-stone-700 truncate">{item.productName}</p>
                                </div>
                                <p className="text-[13px] font-semibold text-stone-800 ml-2 shrink-0">
                                    {formatCurrency(item.quantity * item.unitPrice)}
                                </p>
                            </div>
                        )) : (
                            <p className="text-stone-400 text-[13px] text-center py-2">Nenhum item.</p>
                        )}
                    </div>

                    {/* Rastreamento */}
                    <TrackingRow
                        orderId={order.id}
                        trackingCode={order.trackingCode}
                        meOrderId={order.meOrderId}
                        isSyncing={syncingTracking}
                        onSave={onSaveTracking}
                        onSync={onSyncTracking}
                    />

                    {/* Ações de impressão */}
                    {order.meOrderId && (
                        <div className="px-5 py-3 flex gap-2">
                            <button
                                onClick={() => onPrintLabel(order)}
                                disabled={printingLabel}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-700 disabled:opacity-50 text-white rounded-xl text-[13px] font-semibold transition-colors"
                            >
                                <Printer size={14} />
                                {printingLabel ? 'Abrindo...' : 'Etiqueta 10×15'}
                            </button>
                            <button
                                onClick={() => onPrintDocs(order)}
                                disabled={printingLabel}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 disabled:opacity-50 text-stone-700 border border-stone-200 rounded-xl text-[13px] font-semibold transition-colors"
                                title="Docs A4"
                            >
                                <Printer size={14} />
                                A4
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

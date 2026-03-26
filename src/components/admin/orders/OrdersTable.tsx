import React from 'react';
import { Eye, Store } from 'lucide-react';
import {
    ORDER_STATUS_CONFIG,
    DELIVERY_STATUS_OPTIONS,
    PICKUP_STATUS_OPTIONS,
} from '@/constants/orderStatus';
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

const formatPhone = (raw: string | null | undefined) => {
    const s = (raw ?? '').trim();
    return s ? maskPhone(s) : '—';
};

interface OrdersTableProps {
    orders: PedidoComCliente[];
    loading: boolean;
    updatingOrderId: string | null;
    onStatusChange: (orderId: string, newStatus: string) => void;
    onViewOrder: (order: PedidoComCliente) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
    orders,
    loading,
    updatingOrderId,
    onStatusChange,
    onViewOrder,
}) => (
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
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-sm text-stone-400">
                                    Nenhum pedido encontrado.
                                </td>
                            </tr>
                        ) : orders.map(order => {
                            const config = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG['aguardando_pagamento'];
                            const pickup = isPickupOrder(order);
                            return (
                                <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-4 py-1.5 min-w-[180px] align-middle">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-xs text-stone-600">
                                                #{order.id.slice(-8).toUpperCase()}
                                            </span>
                                            {pickup && (
                                                <span className="inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-medium rounded-full border border-indigo-100">
                                                    <Store size={10} /> Retirada
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-1.5 align-middle w-px whitespace-nowrap">
                                        <p className="text-sm text-stone-700">{order.clientName}</p>
                                        <p className="text-xs text-stone-400">{formatPhone(order.clientPhone)}</p>
                                    </td>
                                    <td className="px-4 py-1.5 align-middle w-px whitespace-nowrap">
                                        <span className="text-sm font-medium text-stone-700">
                                            {formatCurrency(order.total)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-1.5 align-middle w-px whitespace-nowrap">
                                        <select
                                            value={order.status}
                                            onChange={e => onStatusChange(order.id, e.target.value)}
                                            disabled={updatingOrderId === order.id}
                                            className={`appearance-none px-2 py-1 rounded text-[11px] font-medium cursor-pointer border-0 focus:ring-1 focus:ring-stone-300 focus:outline-none ${config.color} ${updatingOrderId === order.id ? 'opacity-50' : ''}`}
                                        >
                                            {(pickup ? PICKUP_STATUS_OPTIONS : DELIVERY_STATUS_OPTIONS).map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-4 py-1.5 align-middle w-px whitespace-nowrap">
                                        <span className="text-xs text-stone-500">{formatDate(order.createdAt)}</span>
                                    </td>
                                    <td className="px-4 py-1.5 text-right align-middle w-px whitespace-nowrap">
                                        <button
                                            onClick={() => onViewOrder(order)}
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
);

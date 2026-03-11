import React from 'react';
import { Package, AlertCircle } from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { StatusBadge } from './StatusBadge';

interface OrdersListProps {
    orders: Order[];
    onViewOrderPayment: (order: Order) => void;
}

const OrdersList: React.FC<OrdersListProps> = ({ orders, onViewOrderPayment }) => {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Package className="mr-3" /> Meus Pedidos
                </h2>
            </div>

            <div className="space-y-6">
                {orders.length === 0 ? (
                    <p className="text-gray-500">Você ainda não realizou nenhum pedido.</p>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center">
                                <div>
                                    <span className="text-sm text-gray-500 block">Pedido #{order.id}</span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(order.createdAt).toLocaleDateString()} às {new Date(order.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="mt-2 sm:mt-0 flex items-center">
                                    <StatusBadge status={order.status} />
                                </div>
                            </div>
                            <div className="p-6">
                                <ul className="mb-4">
                                    {order.items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between text-sm py-1">
                                            <span className="text-gray-700">
                                                {item.quantity}x {item.productName}
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice * item.quantity)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="pt-4 border-t border-gray-100 text-sm mb-4 bg-gray-50 p-3 rounded">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.subtotal || order.total)}</span>
                                    </div>
                                    {order.shippingCost !== undefined && (
                                        <div className="flex justify-between mb-1">
                                            <span className="text-gray-600">Frete ({order.shippingMethod})</span>
                                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.shippingCost)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-gray-900 mt-2 pt-2 border-t border-gray-200">
                                        <span>Total</span>
                                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</span>
                                    </div>
                                </div>

                                {order.status === OrderStatus.WAITING_PAYMENT && (
                                    <div className="mt-4 flex flex-col space-y-3">
                                        <div className="bg-yellow-50 border border-yellow-100 p-3 rounded flex items-start">
                                            <AlertCircle size={18} className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm text-yellow-800 font-medium">Aguardando Pagamento</p>
                                                <p className="text-xs text-yellow-700 mt-1">
                                                    A confirmação do Pix pode levar alguns minutos.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={() => onViewOrderPayment(order)}
                                                className="flex-1 bg-agro-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-agro-700"
                                            >
                                                Ver Pix Copia e Cola
                                            </button>

                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default OrdersList;


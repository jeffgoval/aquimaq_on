import React from 'react';
import { OrderStatus } from '@/types';

export const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const styles: Record<OrderStatus, string> = {
    [OrderStatus.DRAFT]: 'bg-gray-100 text-gray-800',
    [OrderStatus.WAITING_PAYMENT]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.PAID]: 'bg-blue-100 text-blue-800',
    [OrderStatus.PICKING]: 'bg-indigo-100 text-indigo-800',
    [OrderStatus.SHIPPED]: 'bg-purple-100 text-purple-800',
    [OrderStatus.READY_PICKUP]: 'bg-orange-100 text-orange-800',
    [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
  };

  const labels: Record<OrderStatus, string> = {
    [OrderStatus.DRAFT]: 'Rascunho',
    [OrderStatus.WAITING_PAYMENT]: 'Aguardando Pagamento',
    [OrderStatus.PAID]: 'Pago',
    [OrderStatus.PICKING]: 'Em Separação',
    [OrderStatus.SHIPPED]: 'Enviado',
    [OrderStatus.READY_PICKUP]: 'Pronto para Retirada',
    [OrderStatus.DELIVERED]: 'Entregue',
    [OrderStatus.CANCELLED]: 'Cancelado',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};


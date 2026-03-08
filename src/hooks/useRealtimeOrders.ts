import { useState, useCallback } from 'react';
import type { Order } from '@/types';

export const useRealtimeOrders = () => {
  const [orders] = useState<Order[]>([]);
  const [loading] = useState(false);
  const refetch = useCallback(() => {}, []);

  return { orders, loading, refetch };
};

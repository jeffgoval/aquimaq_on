import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '@/features/cart';
import { Order } from '@/types';

export const useOrders = (clientId: string | undefined) => {
    return useQuery({
        queryKey: ['orders', clientId],
        queryFn: () => {
            if (!clientId) throw new Error('Client ID is required');
            return fetchOrders(clientId);
        },
        enabled: !!clientId,
    });
};

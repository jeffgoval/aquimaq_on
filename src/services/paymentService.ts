import { supabase } from '@/services/supabase';
import type { PaymentRow, PaymentStatus } from '@/types/database';

export const getPaymentByOrderId = async (orderId: string): Promise<PaymentRow | null> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('getPaymentByOrderId error:', error);
    return null;
  }
  return data as PaymentRow | null;
};

export const getPaymentStatus = async (orderId: string): Promise<PaymentStatus | null> => {
  const payment = await getPaymentByOrderId(orderId);
  return payment?.status ?? null;
};

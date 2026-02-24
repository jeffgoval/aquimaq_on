import { supabase } from '@/services/supabase';
import type { PaymentRow, PaymentStatus } from '@/types/database';
import { ENV } from '@/config/env';

export const createCheckoutPreference = async (
  orderId: string,
  items?: any[],
  payer?: any
): Promise<{ id: string; checkout_url: string }> => {
  const { data, error } = await supabase.functions.invoke('mercado-pago-create-preference', {
    body: { order_id: orderId, items, payer },
  });

  if (error) {
    throw new Error(error.message || 'Erro ao criar checkout');
  }

  return data as { id: string; checkout_url: string };
};

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

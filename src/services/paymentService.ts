import { supabase } from '@/services/supabase';
import type { PaymentRow, PaymentStatus } from '@/types/database';
import { ENV } from '@/config/env';

const FUNCTIONS_URL = `${ENV.VITE_SUPABASE_URL}/functions/v1`;

const HEADERS = {
  'Content-Type': 'application/json',
  apikey: ENV.VITE_SUPABASE_ANON_KEY,
};

export const createCheckoutPreference = async (
  orderId: string,
  items?: any[],
  payer?: any
): Promise<{ id: string; checkout_url: string }> => {
  const res = await fetch(`${FUNCTIONS_URL}/mercado-pago-create-preference`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ order_id: orderId, items, payer }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Erro ao criar checkout');
  }
  return res.json() as Promise<{ id: string; checkout_url: string }>;
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

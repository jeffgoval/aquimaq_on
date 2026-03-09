import { supabase } from '@/services/supabase';
import type { CartItem, ShippingOption } from '@/types';
import type { ProfileRow } from '@/types/database';
import { calculateItemPrice } from '@/utils/price';
import { ENV } from '@/config/env';

export interface CheckoutResult {
  order_id: string;
  checkout_url: string;
}

export interface CheckoutParams {
  cart: CartItem[];
  subtotal: number;
  shippingCost: number;
  grandTotal: number;
  selectedShipping: ShippingOption;
  profile: ProfileRow;
}

/**
 * Calls the Supabase Edge Function `checkout` directly via fetch,
 * explicitly passing the user's access token.
 */
export async function createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
  const { cart, subtotal, shippingCost, grandTotal, selectedShipping, profile } = params;

  // 1. Get the current session token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Você precisa estar logado para finalizar a compra.');
  }

  // 2. Build items in Mercado Pago format
  const items = cart.map((item) => ({
    id: item.id,
    title: item.name,
    description: (item.description || item.name).slice(0, 256),
    category_id: 'others',
    quantity: item.quantity,
    unit_price: Number(calculateItemPrice(item).toFixed(2)),
    currency_id: 'BRL',
  }));

  // Add shipping as a separate item if it has cost
  if (shippingCost > 0) {
    items.push({
      id: 'shipping',
      title: `Frete - ${selectedShipping.carrier} ${selectedShipping.service}`,
      description: `Entrega estimada: ${selectedShipping.estimatedDays} dias úteis`,
      category_id: 'others',
      quantity: 1,
      unit_price: Number(shippingCost.toFixed(2)),
      currency_id: 'BRL',
    });
  }

  const payload = {
    order: {
      subtotal,
      shipping_cost: shippingCost,
      total: grandTotal,
      shipping_method: `${selectedShipping.carrier} - ${selectedShipping.service}`,
      shipping_address: {
        street: profile.street ?? null,
        number: profile.number ?? null,
        neighborhood: profile.neighborhood ?? null,
        city: profile.city ?? null,
        state: profile.state ?? null,
        zip_code: profile.zip_code ?? null,
      },
    },
    items,
    // payer omitted — sending real email with test seller credentials causes
    // "Uma das partes é de teste" error in the MP sandbox
    back_url_base: window.location.origin,
  };

  // 3. Call edge function directly via fetch with explicit auth token
  const response = await fetch(`${ENV.VITE_SUPABASE_URL}/functions/v1/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': ENV.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Checkout error:', response.status, data);
    throw new Error(data?.error || `Erro ao processar pagamento (${response.status}).`);
  }

  if (!data?.checkout_url) {
    console.error('Checkout response missing checkout_url:', data);
    throw new Error('Erro ao gerar link de pagamento.');
  }

  return {
    order_id: data.order_id,
    checkout_url: data.checkout_url,
  };
}


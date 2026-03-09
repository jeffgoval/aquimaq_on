import { ShippingOption, ShippingResult } from '@/types';
import { validateCEP } from '@/utils/validators';
import { ENV } from '@/config/env';

/** Item do carrinho com dados mínimos para frete (id, quantity, price, dimensões opcionais) */
export interface CartItemForShipping {
  id: string;
  name?: string;
  quantity: number;
  price: number;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
}

const PICKUP_OPTION: ShippingOption = {
  id: 'pickup_store',
  carrier: 'Loja Física',
  service: 'Retirada no Balcão',
  price: 0,
  estimatedDays: 0,
};


/**
 * Calcula opções de frete: chama Edge Function Melhor Envios e mantém sempre Retirada no Balcão.
 */
export const calculateShipping = async (
  cep: string,
  items: CartItemForShipping[] = []
): Promise<ShippingResult> => {
  if (!validateCEP(cep)) {
    return { options: [], error: 'CEP inválido' };
  }

  const cepClean = cep.replace(/\D/g, '');
  if (cepClean.length !== 8) {
    return { options: [PICKUP_OPTION], error: 'CEP inválido' };
  }

  const resultOptions: ShippingOption[] = [PICKUP_OPTION];

  try {
    const payload = {
      destination_cep: cepClean,
      insurance_value: items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0),
      items:
        items.length > 0
          ? items.flatMap((item) =>
            Array.from({ length: item.quantity }, () => ({
              id: item.id,                 // required by ME API spec
              weight: item.weight ?? 1,
              width: item.width ?? 16,
              height: item.height ?? 2,
              length: item.length ?? 11,
              quantity: 1,
            }))
          )
          : [{ id: 'default', weight: 1, width: 16, height: 2, length: 11, quantity: 1 }],
    };

    const response = await fetch(`${ENV.VITE_SUPABASE_URL}/functions/v1/melhor-envios-quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ENV.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${ENV.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();

    const data = responseData as { options?: ShippingOption[]; error?: string };

    if (data.options?.length) {
      data.options.forEach((opt) => {
        if (opt.id !== PICKUP_OPTION.id) resultOptions.push(opt);
      });
    }

    return {
      options: resultOptions,
      error: data.error,
    };
  } catch (e) {
    console.error('Shipping quote error:', e);
    return {
      options: [PICKUP_OPTION],
      error: 'Não foi possível calcular o frete. Use retirada no balcão.',
    };
  }
};

export const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
};

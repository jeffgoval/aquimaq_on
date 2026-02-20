import { ShippingOption, ShippingResult } from '@/types';
import { validateCEP } from '@/utils/validators';

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
 * Retorna opção de retirada na loja. Cálculo de frete por transportadora foi descontinuado.
 */
export const calculateShipping = async (
  cep: string,
  _items: CartItemForShipping[] = []
): Promise<ShippingResult> => {
  if (!validateCEP(cep)) {
    return { options: [], error: 'CEP inválido' };
  }
  return {
    options: [PICKUP_OPTION],
    error: 'Frete por transportadora: entre em contato para cotação.',
  };
};

export const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
};

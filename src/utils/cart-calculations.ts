import type { CartItem, ShippingOption } from '@/types';
import { calculateItemSubtotal } from '@/utils/price';

/**
 * Subtotal do carrinho (soma dos subtotais de cada item, com descontos de atacado já aplicados).
 * Função pura: pode ser usada fora do contexto (componentes, testes, etc.).
 */
export const getCartSubtotal = (cart: CartItem[]): number =>
  cart.reduce((acc, item) => acc + calculateItemSubtotal(item), 0);

/**
 * Número total de unidades no carrinho.
 */
export const getCartItemCount = (cart: CartItem[]): number =>
  cart.reduce((acc, item) => acc + item.quantity, 0);

/**
 * Custo de envio a partir da opção selecionada.
 */
export const getShippingCost = (selectedShipping: ShippingOption | null): number =>
  selectedShipping ? selectedShipping.price : 0;

/**
 * Total final: subtotal do carrinho + custo de envio.
 */
export const getGrandTotal = (cartSubtotal: number, shippingCost: number): number =>
  cartSubtotal + shippingCost;

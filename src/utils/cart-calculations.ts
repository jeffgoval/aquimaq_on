import type { CartItem, Coupon, ShippingOption } from '@/types';
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
 * Total final: subtotal do carrinho + custo de envio − desconto de cupom.
 */
export const getGrandTotal = (cartSubtotal: number, shippingCost: number, couponDiscount = 0): number =>
  Math.max(0, cartSubtotal + shippingCost - couponDiscount);

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Valor do desconto aplicado pelo cupom sobre o subtotal do carrinho.
 */
export const getCouponDiscount = (coupon: Coupon | null, subtotal: number): number => {
  if (!coupon) return 0;
  if (subtotal < coupon.min_purchase_amount) return 0;
  if (coupon.discount_type === 'percentage') {
    return round2(subtotal * (coupon.discount_value / 100));
  }
  return Math.min(coupon.discount_value, subtotal);
};

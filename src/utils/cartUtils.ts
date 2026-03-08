import type { CartItem } from '@/types';
import { calculateItemPrice } from '@/utils/price';

// Re-export para uso em ProductCard e outros; regra única em price.ts
export { calculateItemPrice } from '@/utils/price';

/**
 * Subtotal do carrinho: soma de (preço unitário efetivo × quantidade) de cada item.
 * Função pura: fácil de testar e a IA entende instantaneamente.
 */
export const calculateCartSubtotal = (cart: CartItem[]): number => {
    return cart.reduce((acc, item) => acc + calculateItemPrice(item) * item.quantity, 0);
};

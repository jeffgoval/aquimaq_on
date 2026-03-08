import type { CartItem } from '@/types';

/**
 * Calcula o preço unitário de um item do carrinho, aplicando desconto de atacado
 * quando a quantidade × preço atinge o mínimo (wholesaleMinAmount).
 */
export const calculateItemPrice = (item: CartItem): number => {
    if (
        item.wholesaleMinAmount != null &&
        item.price * item.quantity >= item.wholesaleMinAmount
    ) {
        if (item.wholesaleDiscountPercent != null) {
            return item.price * (1 - item.wholesaleDiscountPercent / 100);
        }
    }
    return item.price;
};

/**
 * Subtotal de um item (preço unitário efetivo × quantidade).
 */
export const calculateItemSubtotal = (item: CartItem): number =>
    calculateItemPrice(item) * item.quantity;

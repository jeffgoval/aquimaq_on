import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product, CartItem, ShippingOption } from '@/types';
import { CartItemsSchema } from '@/schemas/cartSchema';

const CART_SHIPPING_KEY = 'cart_shipping';

function getInitialShipping(): { shippingZip: string; selectedShipping: ShippingOption | null } {
    try {
        const saved = localStorage.getItem(CART_SHIPPING_KEY);
        if (!saved) return { shippingZip: '', selectedShipping: null };
        const parsed = JSON.parse(saved);
        return {
            shippingZip: typeof parsed.shippingZip === 'string' ? parsed.shippingZip : '',
            selectedShipping: parsed.selectedShipping && typeof parsed.selectedShipping === 'object' ? parsed.selectedShipping as ShippingOption : null
        };
    } catch {
        return { shippingZip: '', selectedShipping: null };
    }
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, delta: number) => void;
    clearCart: () => void;
    cartSubtotal: number;
    cartItemCount: number;
    selectedShipping: ShippingOption | null;
    setSelectedShipping: (option: ShippingOption | null) => void;
    shippingZip: string;
    setShippingZip: (zip: string) => void;
    shippingCost: number;
    grandTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>(() => {
        try {
            const saved = localStorage.getItem('cart');
            if (saved) {
                const parsed = CartItemsSchema.safeParse(JSON.parse(saved));
                if (parsed.success) return parsed.data as CartItem[];
            }
            return [];
        } catch {
            return [];
        }
    });

    const [shipping, setShipping] = useState(getInitialShipping);
    const { shippingZip, selectedShipping } = shipping;

    const setShippingZip = (zip: string) => setShipping(prev => ({ ...prev, shippingZip: zip }));
    const setSelectedShipping = (option: ShippingOption | null) => setShipping(prev => ({ ...prev, selectedShipping: option }));

    useEffect(() => {
        try { localStorage.setItem('cart', JSON.stringify(cart)); } catch { /* */ }
    }, [cart]);

    useEffect(() => {
        try { localStorage.setItem(CART_SHIPPING_KEY, JSON.stringify({ shippingZip, selectedShipping })); } catch { /* */ }
    }, [shippingZip, selectedShipping]);

    const addToCart = useCallback((product: Product, quantity: number = 1) => {
        const qty = Math.max(1, Math.floor(quantity));
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
                );
            }
            return [...prev, { ...product, quantity: qty }];
        });
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
        setShipping({ shippingZip: '', selectedShipping: null });
        try { localStorage.removeItem(CART_SHIPPING_KEY); } catch { /* */ }
    }, []);

    const cartSubtotal = cart.reduce((acc, item) => {
        let itemPrice = item.price;
        if (item.wholesaleMinAmount && (item.price * item.quantity >= item.wholesaleMinAmount)) {
            if (item.wholesaleDiscountPercent) {
                itemPrice = item.price * (1 - item.wholesaleDiscountPercent / 100);
            }
        }
        return acc + (itemPrice * item.quantity);
    }, 0);

    const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const shippingCost = selectedShipping ? selectedShipping.price : 0;
    const grandTotal = cartSubtotal + shippingCost;

    return (
        <CartContext.Provider value={{
            cart, addToCart, removeFromCart, updateQuantity, clearCart,
            cartSubtotal, cartItemCount,
            selectedShipping, setSelectedShipping,
            shippingZip, setShippingZip,
            shippingCost, grandTotal
        }}>
            {children}
        </CartContext.Provider>
    );
};

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) throw new Error('useCart must be used within a CartProvider');
    return context;
}

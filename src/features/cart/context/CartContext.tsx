import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product, CartItem, Coupon, ShippingOption } from '@/types';
import { CartItemsSchema } from '../schemas/cartSchema';
import { getCartSubtotal, getCartItemCount, getShippingCost, getGrandTotal, getCouponDiscount } from '@/utils/cart-calculations';
import { validateCoupon } from '@/services/couponService';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/services/supabase';

const CART_COUPON_KEY = 'cart_coupon';

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
    appliedCoupon: Coupon | null;
    couponDiscount: number;
    applyCoupon: (code: string) => Promise<void>;
    removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { showToast } = useToast();
    const [cart, setCart] = useState<CartItem[]>(() => {
        try {
            const saved = localStorage.getItem('cart');
            if (saved) {
                const parsed = CartItemsSchema.safeParse(JSON.parse(saved));
                if (parsed.success) return parsed.data as unknown as CartItem[];
            }
            return [];
        } catch {
            return [];
        }
    });

    const [shipping, setShipping] = useState(getInitialShipping);
    const { shippingZip, selectedShipping } = shipping;

    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
        try {
            const saved = localStorage.getItem(CART_COUPON_KEY);
            return saved ? JSON.parse(saved) as Coupon : null;
        } catch {
            return null;
        }
    });

    const setShippingZip = (zip: string) => setShipping(prev => ({ ...prev, shippingZip: zip }));
    const setSelectedShipping = (option: ShippingOption | null) => setShipping(prev => ({ ...prev, selectedShipping: option }));

    useEffect(() => {
        try { localStorage.setItem('cart', JSON.stringify(cart)); } catch { /* */ }
    }, [cart]);

    useEffect(() => {
        try { localStorage.setItem(CART_SHIPPING_KEY, JSON.stringify({ shippingZip, selectedShipping })); } catch { /* */ }
    }, [shippingZip, selectedShipping]);

    // Sincroniza o carrinho com cart_sessions no Supabase (usuários autenticados).
    // Permite que automações n8n detectem carrinhos abandonados.
    // localStorage continua sendo a fonte de verdade; este sync é best-effort.
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.id) return;
                if (cart.length === 0) {
                    await supabase.from('cart_sessions').delete().eq('user_id', session.user.id);
                } else {
                    await supabase.from('cart_sessions').upsert({
                        user_id: session.user.id,
                        items: cart as unknown as Record<string, unknown>[],
                        subtotal: getCartSubtotal(cart),
                        item_count: getCartItemCount(cart),
                    }, { onConflict: 'user_id' });
                }
            } catch { /* falha silenciosa — localStorage é fonte de verdade */ }
        }, 5000);
        return () => clearTimeout(timer);
    }, [cart]);

    const addToCart = useCallback((product: Product, quantity: number = 1) => {
        const qty = Math.max(1, Math.floor(quantity));
        let isNew = false;
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            isNew = !existing;
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
                );
            }
            return [...prev, { ...product, quantity: qty }];
        });
        showToast(
            isNew
                ? `"${product.name}" adicionado ao carrinho!`
                : `Quantidade de "${product.name}" atualizada.`,
            'success'
        );
    }, [showToast]);

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
        setAppliedCoupon(null);
        try { localStorage.removeItem(CART_SHIPPING_KEY); } catch { /* */ }
        try { localStorage.removeItem(CART_COUPON_KEY); } catch { /* */ }
    }, []);

    const applyCoupon = useCallback(async (code: string) => {
        const subtotal = getCartSubtotal(cart);
        const coupon = await validateCoupon(code, subtotal);
        setAppliedCoupon(coupon);
        try { localStorage.setItem(CART_COUPON_KEY, JSON.stringify(coupon)); } catch { /* */ }
    }, [cart]);

    const removeCoupon = useCallback(() => {
        setAppliedCoupon(null);
        try { localStorage.removeItem(CART_COUPON_KEY); } catch { /* */ }
    }, []);

    const cartSubtotal = getCartSubtotal(cart);
    const cartItemCount = getCartItemCount(cart);
    const shippingCost = getShippingCost(selectedShipping);
    const couponDiscount = getCouponDiscount(appliedCoupon, cartSubtotal);
    const grandTotal = getGrandTotal(cartSubtotal, shippingCost, couponDiscount);

    return (
        <CartContext.Provider value={{
            cart, addToCart, removeFromCart, updateQuantity, clearCart,
            cartSubtotal, cartItemCount,
            selectedShipping, setSelectedShipping,
            shippingZip, setShippingZip,
            shippingCost, grandTotal,
            appliedCoupon, couponDiscount, applyCoupon, removeCoupon,
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

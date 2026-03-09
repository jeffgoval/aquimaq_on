import React, { useState } from 'react';
import Cart from '../components/Cart';
import { useCart } from '../context/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { createCheckout } from '@/services/checkoutService';
import { checkStockAvailability } from '../services/orderService';

const CartPage: React.FC = () => {
    const {
        cart,
        cartSubtotal,
        updateQuantity,
        removeFromCart,
        selectedShipping,
        setSelectedShipping,
        setShippingZip,
        shippingCost,
        grandTotal,
        shippingZip,
        clearCart,
    } = useCart();

    const { showToast } = useToast();
    const { profile } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCheckout = async () => {
        if (!profile || !selectedShipping || cart.length === 0) return;
        if (isProcessing) return;

        setIsProcessing(true);
        try {
            // 1. Verify stock availability
            await checkStockAvailability(cart);

            // 2. Create checkout (order + MP preference)
            const result = await createCheckout({
                cart,
                subtotal: cartSubtotal,
                shippingCost,
                grandTotal,
                selectedShipping,
                profile,
            });

            // 3. Clear cart before redirect
            clearCart();

            // 4. Redirect to Mercado Pago
            window.location.href = result.checkout_url;
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Erro inesperado ao processar pagamento.';
            showToast(message, 'error');
            setIsProcessing(false);
        }
    };

    return (
        <Cart
            items={cart}
            cartSubtotal={cartSubtotal}
            shippingCost={shippingCost}
            grandTotal={grandTotal}
            selectedShipping={selectedShipping}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onSelectShipping={setSelectedShipping}
            onZipValid={setShippingZip}
            onCheckout={handleCheckout}
            initialZip={shippingZip}
            isProcessing={isProcessing}
        />
    );
};

export default CartPage;


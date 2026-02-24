import React, { useState } from 'react';
import Cart from '../components/Cart';
import { useCart } from '../context/CartContext';
import { createCheckoutPreference } from '@/services/paymentService';
import { useToast } from '@/contexts/ToastContext';

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
        shippingZip
    } = useCart();

    const { showToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        setIsProcessing(true);
        try {
            const orderId = `order_${Math.random().toString(36).slice(2, 9)}`;

            // Map items for MP format
            const mpItems = cart.map(item => ({
                id: item.id,
                title: item.name,
                unit_price: item.price,
                quantity: item.quantity,
                category_id: item.category || 'others'
            }));

            const response = await createCheckoutPreference(orderId, mpItems);
            setPreferenceId(response.id);
        } catch (error) {
            console.error('Checkout error:', error);
            showToast('Erro ao iniciar pagamento. Tente novamente.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const [preferenceId, setPreferenceId] = useState<string | null>(null);

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
            preferenceId={preferenceId}
            initialZip={shippingZip}
            isProcessing={isProcessing}
        />
    );
};

export default CartPage;

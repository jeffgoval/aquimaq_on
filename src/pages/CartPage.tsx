import React, { useState } from 'react';
import Cart from '@/components/Cart';
import { useCart } from '@/contexts/CartContext';

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

    // Local state for processing indication if needed by Cart
    const [isProcessing, setIsProcessing] = useState(false);

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
            initialZip={shippingZip}
            isProcessing={isProcessing}
        />
    );
};

export default CartPage;


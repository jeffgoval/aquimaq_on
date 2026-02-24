import React, { useState } from 'react';
import Cart from '../components/Cart';
import { useCart } from '../context/CartContext';
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
        />
    );
};

export default CartPage;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cart from '../components/Cart';
import { useCart } from '../context/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { createCheckout } from '@/services/checkoutService';
import { checkStockAvailability } from '../services/orderService';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { getProductById } from '@/services/productService';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils/format';

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
    const [recentProducts, setRecentProducts] = useState<any[]>([]);
    const { ids: recentIds } = useRecentlyViewed();

    useEffect(() => {
        if (recentIds.length === 0) return;
        Promise.all(recentIds.slice(0, 4).map(id => getProductById(id)))
            .then(results => setRecentProducts(results.filter(Boolean)));
    }, [recentIds.join(',')]);

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
                shippingCost,
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
        <>
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
                initialZip={shippingZip || profile?.zip_code?.replace(/\D/g, '') || undefined}
                isProcessing={isProcessing}
            />
            {cart.length > 0 && recentProducts.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Vistos recentemente</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {recentProducts.map(p => (
                            <Link key={p.id} to={ROUTES.PRODUCT(p.id)}
                                className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-2 hover:border-agro-300 transition-colors text-sm"
                            >
                                {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-contain rounded shrink-0" />}
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-800 line-clamp-1">{p.name}</p>
                                    <p className="text-xs text-agro-600 font-bold">{formatCurrency(p.price)}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default CartPage;


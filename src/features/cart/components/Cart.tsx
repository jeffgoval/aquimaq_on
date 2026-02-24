import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronLeft, Trash2, ImageOff, MessageCircle, CreditCard, Loader2 } from 'lucide-react';
import { Wallet } from '@mercadopago/sdk-react';
import { CartItem, ShippingOption } from '@/types';
import { formatCurrency } from '@/utils/format';
import { calculateItemPrice, calculateItemSubtotal } from '@/utils/price';
import ShippingCalculator from './ShippingCalculator';
import CartProgress from './CartProgress';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/contexts/ToastContext';
import { ENV } from '@/config/env';
import { useStore } from '@/contexts/StoreContext';

interface CartProps {
  items: CartItem[];
  cartSubtotal: number;
  shippingCost: number;
  grandTotal: number;
  selectedShipping: ShippingOption | null;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onSelectShipping: (option: ShippingOption | null) => void;
  onZipValid?: (rawZip: string) => void;
  onCheckout?: () => void;
  onBackToCatalog?: () => void;
  initialZip?: string;
  isProcessing?: boolean;
  preferenceId?: string | null;
}

const Cart: React.FC<CartProps> = ({
  items,
  cartSubtotal,
  shippingCost,
  grandTotal,
  selectedShipping,
  onUpdateQuantity,
  onRemoveItem,
  onSelectShipping,
  onZipValid,
  onCheckout,
  onBackToCatalog,
  initialZip,
  isProcessing = false,
  preferenceId
}) => {
  const navigate = useNavigate();
  const { settings } = useStore();
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = useCallback((itemId: string) => {
    setImageErrors(prev => new Set(prev).add(itemId));
  }, []);

  const handleBackToCatalog = () => {
    navigate(ROUTES.HOME);
  };

  const whatsappNumber = settings?.phone?.replace(/\D/g, '') ?? '';

  const handleWhatsAppCheckout = () => {
    const itemsList = items.map(item => `- ${item.name} (${item.quantity}x)`).join('\n');
    const message = `Olá! Gostaria de finalizar o pedido:\n\n${itemsList}\n\nSubtotal: ${formatCurrency(cartSubtotal)}\nFrete: ${selectedShipping ? formatCurrency(shippingCost) : 'A combinar'}\nTotal: ${formatCurrency(grandTotal)}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Empty state
  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <button onClick={handleBackToCatalog} className="mr-4 text-gray-500 hover:text-gray-900 md:hidden" aria-label="Voltar ao catálogo">
            <ChevronLeft />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="mr-3" /> Carrinho de Compras
          </h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Seu carrinho está vazio</h3>
          <p className="text-gray-500 mb-6">Navegue pelo catálogo e adicione itens essenciais para sua produção.</p>
          <button
            onClick={handleBackToCatalog}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-agro-600 hover:bg-agro-700"
            aria-label="Ir para o catálogo de produtos"
          >
            Ir para o Catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <button onClick={handleBackToCatalog} className="mr-4 text-gray-500 hover:text-gray-900 md:hidden">
          <ChevronLeft />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <ShoppingCart className="mr-3" /> Carrinho de Compras
        </h2>
      </div>

      <CartProgress items={items} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {items.map(item => (
            <li key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-4 w-full sm:w-auto">
                {imageErrors.has(item.id) ? (
                  <div className="w-20 h-20 rounded-md flex-shrink-0 border border-gray-100 bg-gray-100 flex items-center justify-center text-gray-400">
                    <ImageOff size={20} />
                  </div>
                ) : (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-md flex-shrink-0 border border-gray-100"
                    onError={() => handleImageError(item.id)}
                  />
                )}
                <div className="flex-1 sm:w-64">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">{item.name}</h4>
                  <p className="text-xs text-gray-500 mb-1">{item.category}</p>
                  <p className="text-sm font-bold text-agro-600">
                    {formatCurrency(calculateItemPrice(item))}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1 sm:justify-end gap-4 mt-2 sm:mt-0 bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none">
                <div className="flex items-center bg-white sm:bg-gray-50 border border-gray-200 rounded-lg">
                  <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors w-8 flex items-center justify-center">-</button>
                  <span className="w-8 text-center font-medium text-sm text-gray-900">{item.quantity}</span>
                  <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors w-8 flex items-center justify-center">+</button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-900 text-sm sm:hidden">{formatCurrency(calculateItemSubtotal(item))}</span>
                  <button onClick={() => onRemoveItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 size={18} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <ShippingCalculator
            cartTotal={cartSubtotal}
            items={items}
            onSelectOption={onSelectShipping}
            selectedOptionId={selectedShipping?.id}
            initialZip={initialZip}
            onZipValid={onZipValid}
          />

          <div className="space-y-3 mb-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-600"><span>Subtotal</span><span>{formatCurrency(cartSubtotal)}</span></div>
            <div className="flex justify-between items-center text-sm text-gray-600"><span>Frete</span><span>{selectedShipping ? (selectedShipping.price === 0 ? 'Grátis' : formatCurrency(shippingCost)) : '--'}</span></div>
            <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-2"><span>Total</span><span className="text-agro-700">{formatCurrency(grandTotal)}</span></div>
          </div>

          {ENV.VITE_MERCADO_PAGO_PUBLIC_KEY && ENV.VITE_MERCADO_PAGO_PUBLIC_KEY.startsWith('APP_USR') && ENV.VITE_MERCADO_PAGO_PUBLIC_KEY !== 'APP_USR-00000000-0000-0000-0000-000000000000' ? (
            <>
              {preferenceId ? (
                <div className="mb-3">
                  <Wallet initialization={{ preferenceId }} />
                </div>
              ) : (
                <button
                  onClick={onCheckout}
                  disabled={isProcessing}
                  className="w-full bg-agro-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-agro-700 transition-colors shadow flex items-center justify-center gap-2 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin" size={22} />
                  ) : (
                    <CreditCard size={22} />
                  )}
                  Pagar com Mercado Pago
                </button>
              )}
            </>
          ) : null}

          <button
            onClick={handleWhatsAppCheckout}
            className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors shadow flex items-center justify-center gap-2"
          >
            <MessageCircle size={22} />
            Finalizar via WhatsApp
          </button>
          <p className="text-xs text-center text-gray-500 mt-4">Faremos o fechamento do seu pedido via WhatsApp.</p>
        </div>
      </div>
    </div>
  );
};

export default Cart;

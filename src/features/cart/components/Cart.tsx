import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronLeft, Trash2, ImageOff, Loader2 } from 'lucide-react';
import { CartItem, ShippingOption } from '@/types';
import { formatCurrency } from '@/utils/format';
import { calculateItemPrice, calculateItemSubtotal } from '@/utils/price';
import ShippingCalculator from './ShippingCalculator';
import CartProgress from './CartProgress';
import { ROUTES } from '@/constants/routes';
import { useToast } from '@/contexts/ToastContext';
import { ENV } from '@/config/env';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AddressEditModal from './AddressEditModal';
import { ProfileRow } from '@/types/database';

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
  onBackToCatalog?: () => void;
  initialZip?: string;
  isProcessing?: boolean;
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
  onBackToCatalog,
  initialZip,
  isProcessing = false
}) => {
  const navigate = useNavigate();
  const { settings } = useStore();
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const isAddressComplete = (p: ProfileRow | null) =>
    !!(p?.street && p?.number && p?.neighborhood && p?.city && p?.state && p?.zip_code);

  const handleImageError = useCallback((itemId: string) => {
    setImageErrors(prev => new Set(prev).add(itemId));
  }, []);

  const handleBackToCatalog = () => navigate(ROUTES.HOME);

  const handleMercadoPagoCheckout = useCallback(async () => {
    if (items.length === 0) return;

    if (!profile) {
      const returnUrl = encodeURIComponent('/carrinho');
      navigate(`/login?redirect=${returnUrl}`);
      return;
    }

    if (!isAddressComplete(profile)) {
      setShowAddressModal(true);
      return;
    }

    setIsCheckoutLoading(true);
    try {
      const mpItems = items.map(item => ({
        id: item.id,
        title: item.name,
        description: item.category as string,
        category_id: item.category as string,
        quantity: item.quantity,
        unit_price: calculateItemPrice(item),
      }));

      if (selectedShipping && shippingCost > 0) {
        mpItems.push({
          id: 'frete',
          title: 'Frete',
          description: `Serviço: ${selectedShipping.service} (${selectedShipping.carrier})`,
          category_id: 'shipping',
          quantity: 1,
          unit_price: shippingCost,
        });
      }

      const payer = {
        email: profile.email || '',
        name: profile.name?.split(' ')[0] || '',
        surname: profile.name?.split(' ').slice(1).join(' ') || '',
        phone: profile.phone ? { number: profile.phone } : undefined,
        address: {
          zip_code: profile.zip_code || initialZip || '',
          street_name: profile.street || '',
          street_number: profile.number || '',
          neighborhood: profile.neighborhood || '',
          city: profile.city || '',
          federal_unit: profile.state || '',
        },
      };

      const order_id = `ORDER_${Date.now()}`;

      const { data, error } = await supabase.functions.invoke('mercado-pago-create-preference', {
        body: { order_id, items: mpItems, payer, siteUrl: window.location.origin },
      });

      if (error) throw new Error(error.message || 'Erro ao comunicar com Mercado Pago.');

      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('URL de checkout não gerada.');
      }
    } catch (err: any) {
      console.error('Checkout MP Error:', err);
      showToast('Erro ao iniciar pagamento. Tente novamente mais tarde.', 'error');
      setIsCheckoutLoading(false);
    }
  }, [items, profile, selectedShipping, shippingCost, initialZip, showToast, navigate]);

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
                  <p className="text-sm font-bold text-agro-600">{formatCurrency(calculateItemPrice(item))}</p>
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

        {showAddressModal && profile && (
          <AddressEditModal
            user={{
              ...profile,
              address: {
                street: profile.street || '',
                number: profile.number || '',
                complement: profile.complement || '',
                district: profile.neighborhood || '',
                city: profile.city || '',
                state: profile.state || '',
                zip: profile.zip_code || initialZip || '',
              }
            }}
            onClose={() => setShowAddressModal(false)}
            onSave={async (updatedData: any) => {
              const addr = updatedData.address;
              const { error } = await supabase
                .from('profiles')
                .update({
                  street: addr.street,
                  number: addr.number,
                  complement: addr.complement,
                  neighborhood: addr.district,
                  city: addr.city,
                  state: addr.state,
                  zip_code: addr.zip,
                } as any)
                .eq('id', profile.id);

              if (error) {
                showToast('Erro ao salvar endereço. Tente novamente.', 'error');
                throw error;
              }
              // Refresh the in-memory profile so isAddressComplete works correctly
              await refreshProfile();
              showToast('Endereço salvo!', 'success');
              setShowAddressModal(false);
              handleMercadoPagoCheckout();
            }}
          />
        )}

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

          <button
            onClick={handleMercadoPagoCheckout}
            disabled={isCheckoutLoading || isProcessing}
            className={`w-full text-white py-4 rounded-lg font-bold text-lg transition-colors shadow flex items-center justify-center gap-2 ${isCheckoutLoading || isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#009EE3] hover:bg-[#0089C5]'
              }`}
          >
            {isCheckoutLoading ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <ShoppingCart size={22} />
            )}
            {isCheckoutLoading ? 'Aguarde...' : 'Pagar com Mercado Pago'}
          </button>
          <p className="text-xs text-center text-gray-500 mt-4">Você será redirecionado para o ambiente seguro do Mercado Pago.</p>
        </div>
      </div>
    </div>
  );
};

export default Cart;

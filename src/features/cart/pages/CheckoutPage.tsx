import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder, checkStockAvailability } from '../services/orderService';
import type { Cliente } from '@/types';
import type { ProfileRow } from '@/types/database';
import { Helmet } from 'react-helmet-async';

function profileToAddress(profile: ProfileRow): Cliente['address'] {
  if (!profile.cep) return undefined;
  return {
    zip: profile.cep,
    street: profile.address || '',
    number: profile.address_number || '',
    complement: profile.address_complement ?? undefined,
    district: profile.neighborhood || '',
    city: profile.city || '',
    state: profile.state || '',
  };
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, user, profile, refreshProfile } = useAuth();
  const {
    cart,
    cartSubtotal,
    selectedShipping,
    shippingCost,
    grandTotal,
    clearCart,
  } = useCart();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) refreshProfile();
  }, [user?.id, refreshProfile]);

  // Sem sessão → login com redirect de volta ao checkout
  if (!session || !user) {
    navigate('/login?redirect=/checkout', { replace: true });
    return null;
  }

  // Carrinho vazio ou frete não selecionado → voltar ao carrinho
  if (cart.length === 0) {
    navigate('/carrinho', { replace: true });
    return null;
  }

  if (!selectedShipping) {
    navigate('/carrinho', { replace: true });
    return null;
  }

  const address = profile ? profileToAddress(profile) : undefined;
  if (!address || !address.street?.trim() || !address.number?.trim()) {
    return (
      <>
        <Helmet>
          <title>Checkout | Aquimaq</title>
        </Helmet>
        <div className="max-w-xl mx-auto px-4 py-12 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Endereço obrigatório</h1>
          <p className="text-gray-600 mb-6">
            Preencha seu endereço de entrega no perfil para continuar com a compra.
          </p>
          <button
            onClick={() => navigate('/perfil')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-agro-600 hover:bg-agro-700"
          >
            Ir para o Perfil
          </button>
        </div>
      </>
    );
  }

  const handleConfirmOrder = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      await checkStockAvailability(cart);
      const order = await createOrder(user.id, cart, selectedShipping, address);
      if (!order) {
        setError('Não foi possível criar o pedido.');
        setIsProcessing(false);
        return;
      }
      clearCart();
      navigate('/pedidos', { replace: true, state: { orderCreated: order.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Checkout | Aquimaq</title>
      </Helmet>
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Finalizar compra</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <p className="text-gray-600 mb-4">
            <strong>{cart.length}</strong> item(ns) · Total <strong>R$ {grandTotal.toFixed(2)}</strong> (incl. frete).
          </p>
          <p className="text-sm text-gray-500">
            Entrega: {selectedShipping.service} · {address.street}, {address.number}, {address.district}, {address.city} - {address.state}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}

        <button
          onClick={handleConfirmOrder}
          disabled={isProcessing}
          className="w-full bg-agro-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-agro-700 transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'A processar...' : 'Confirmar pedido'}
        </button>

        <p className="text-xs text-center text-gray-500 mt-4">
          O pedido será criado e você poderá acompanhar em Meus Pedidos. Entre em contato para combinar a forma de pagamento.
        </p>
      </div>
    </>
  );
};

export default CheckoutPage;

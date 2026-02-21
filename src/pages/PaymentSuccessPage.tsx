import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Helmet } from 'react-helmet-async';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('external_reference') ?? searchParams.get('order_id') ?? '';

  return (
    <>
      <Helmet>
        <title>Pagamento aprovado | Aquimaq</title>
      </Helmet>
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento aprovado</h1>
        <p className="text-gray-600 mb-6">
          Obrigado pela sua compra. O pedido foi confirmado e você pode acompanhar o envio em Meus Pedidos.
          {orderId && (
            <span className="block mt-2 text-sm text-gray-500">Pedido #{orderId.slice(0, 8)}</span>
          )}
        </p>
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-agro-600 hover:bg-agro-700"
        >
          Voltar ao início
        </Link>
        <p className="mt-4">
          <Link to={ROUTES.HOME} className="text-agro-600 hover:text-agro-700 text-sm">
            Voltar ao início
          </Link>
        </p>
      </div>
    </>
  );
};

export default PaymentSuccessPage;

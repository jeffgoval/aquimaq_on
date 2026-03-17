import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Helmet } from 'react-helmet-async';

const PaymentFailurePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('external_reference') ?? '';

  return (
    <>
      <Helmet>
        <title>Pagamento não aprovado | Aquimaq</title>
      </Helmet>
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="rounded-full bg-red-100 w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento não aprovado</h1>
        <p className="text-gray-600 mb-6">
          O pagamento não foi concluído. Você pode tentar novamente ou escolher outra forma de pagamento.
          {orderId && (
            <span className="block mt-2 text-sm text-gray-500">Pedido #{orderId.slice(0, 8)}</span>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={ROUTES.CART}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-agro-600 hover:bg-agro-700"
          >
            Tentar novamente
          </Link>
          <Link
            to={ROUTES.ORDERS}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Ver meus pedidos
          </Link>
        </div>
        <p className="mt-4">
          <Link to={ROUTES.HOME} className="text-agro-700 hover:text-agro-700 text-sm">
            Voltar ao início
          </Link>
        </p>
      </div>
    </>
  );
};

export default PaymentFailurePage;

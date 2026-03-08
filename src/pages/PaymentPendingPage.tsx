import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Helmet } from 'react-helmet-async';

const PaymentPendingPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Pagamento pendente | Aquimaq</title>
      </Helmet>
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="rounded-full bg-amber-100 w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento em processamento</h1>
        <p className="text-gray-600 mb-6">
          O seu pagamento (boleto ou PIX) está a ser processado. Assim que for confirmado, você receberá uma notificação e poderá acompanhar em Meus Pedidos.
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

export default PaymentPendingPage;

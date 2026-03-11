import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Helmet } from 'react-helmet-async';
import { getProducts } from '@/services/productService';
import { formatCurrency } from '@/utils/format';
import { useStore } from '@/contexts/StoreContext';
import { ProductCategory } from '@/types';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('external_reference') ?? searchParams.get('order_id') ?? '';
  const { settings } = useStore();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (settings && settings.crossSellEnabled === false) return;
    const params: Record<string, unknown> = { sortBy: 'best_sellers', pageSize: 4 };
    if (settings?.crossSellCategory) params.category = settings.crossSellCategory as ProductCategory;
    getProducts(params).then(({ data }) => setProducts(data)).catch(() => {});
  }, [settings?.crossSellEnabled, settings?.crossSellCategory]);

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
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={ROUTES.ORDERS}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-agro-600 hover:bg-agro-700"
          >
            Ver meus pedidos
          </Link>
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Continuar comprando
          </Link>
        </div>
        {products.length > 0 && (
          <div className="mt-12 text-left">
            <h2 className="text-base font-semibold text-gray-800 mb-4 text-center">Outros clientes também compraram</h2>
            <div className="grid grid-cols-2 gap-3">
              {products.map(p => (
                <Link key={p.id} to={ROUTES.PRODUCT(p.id)}
                  className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 hover:border-agro-300 transition-colors"
                >
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-contain rounded-lg shrink-0 bg-gray-50" />}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{p.name}</p>
                    <p className="text-sm font-bold text-agro-600 mt-1">{formatCurrency(p.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PaymentSuccessPage;

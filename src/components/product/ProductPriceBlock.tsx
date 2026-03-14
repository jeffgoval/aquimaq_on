import React from 'react';
import { Zap, Users } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { useStore } from '@/contexts/StoreContext';

interface ProductPriceBlockProps {
  price: number;
  oldPrice?: number;
  discount?: number;
  maxInstallments: number;
  wholesaleMinAmount?: number;
  wholesaleDiscountPercent?: number;
}

export const ProductPriceBlock: React.FC<ProductPriceBlockProps> = ({
  price,
  oldPrice,
  discount,
  maxInstallments,
  wholesaleMinAmount,
  wholesaleDiscountPercent,
}) => {
  const { settings } = useStore();
  const pixPrice = price * (1 - (settings?.pixDiscount ?? 0.05));
  const installmentValue = price / maxInstallments;
  const hasWholesale =
    wholesaleMinAmount != null && wholesaleDiscountPercent != null;

  return (
    <>
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
        {oldPrice != null && oldPrice > 0 && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-400 text-sm line-through">
              {formatCurrency(oldPrice)}
            </span>
            {discount != null && discount > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                -{discount}%
              </span>
            )}
          </div>
        )}

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-4xl font-extrabold text-gray-900">
            {formatCurrency(price)}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-sm font-bold px-3 py-1.5 rounded-lg">
            <Zap size={14} />
            {formatCurrency(pixPrice)} no Pix
            <span className="bg-green-200 text-green-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
              {((settings?.pixDiscount ?? 0.05) * 100).toFixed(0)}% OFF
            </span>
          </span>
        </div>

        <p className="text-sm text-gray-500">
          ou{' '}
          <span className="font-semibold text-gray-700">
            {maxInstallments}x de {formatCurrency(installmentValue)}
          </span>{' '}
          sem juros
        </p>
      </div>

      {hasWholesale && (
        <div className="flex items-start gap-3 bg-agro-50 border border-agro-100 rounded-xl p-4">
          <Users size={18} className="text-agro-700 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-agro-800">Desconto Atacado</p>
            <p className="text-sm text-agro-700">
              Compras a partir de {formatCurrency(wholesaleMinAmount!)} ganham{' '}
              <strong>{wholesaleDiscountPercent}% de desconto</strong> por item.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

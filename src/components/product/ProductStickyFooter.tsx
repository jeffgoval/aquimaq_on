import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types';

interface ProductStickyFooterProps {
  product: Product;
  quantity: number;
  onAddToCart: (product: Product, quantity?: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const ProductStickyFooter: React.FC<ProductStickyFooterProps> = ({
  product,
  quantity,
  onAddToCart,
  onBuyNow,
}) => {
  const isOutOfStock = product.stock === 0;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        {product.oldPrice != null && product.oldPrice > 0 && (
          <span className="text-xs text-gray-400 line-through block leading-none">
            {formatCurrency(product.oldPrice)}
          </span>
        )}
        <span className="text-lg font-extrabold text-gray-900 leading-tight block">
          {formatCurrency(product.price)}
        </span>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onAddToCart(product, quantity)}
        disabled={isOutOfStock}
        aria-label="Adicionar ao carrinho"
        className="w-11 h-11 shrink-0 p-0"
      >
        <ShoppingCart size={17} />
      </Button>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => onBuyNow(product, quantity)}
        disabled={isOutOfStock}
        className="flex-1 shrink-0 min-w-[110px]"
      >
        Comprar Agora
      </Button>
    </div>
  );
};

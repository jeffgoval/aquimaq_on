import React from 'react';
import { ShoppingCart } from 'lucide-react';
import QuantitySelector from '@/components/ui/QuantitySelector';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types';

interface ProductCTAsProps {
  product: Product;
  quantity: number;
  onQuantityChange: (value: number) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
  ctaRef: React.RefObject<HTMLDivElement | null>;
}

export const ProductCTAs: React.FC<ProductCTAsProps> = ({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  ctaRef,
}) => {
  const isOutOfStock = product.stock === 0;

  return (
    <div ref={ctaRef} className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-700">Quantidade</span>
        <QuantitySelector
          value={quantity}
          min={1}
          max={Math.max(1, product.stock ?? 1)}
          onChange={onQuantityChange}
          showMaxMessage
          disabled={isOutOfStock}
        />
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={() => onBuyNow(product, quantity)}
        disabled={isOutOfStock}
        className="w-full"
      >
        {isOutOfStock ? 'Indisponível' : 'Comprar Agora'}
      </Button>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={() => onAddToCart(product, quantity)}
        disabled={isOutOfStock}
        className="w-full"
      >
        <ShoppingCart size={18} />
        {isOutOfStock ? 'Indisponível' : 'Adicionar ao Carrinho'}
      </Button>
    </div>
  );
};

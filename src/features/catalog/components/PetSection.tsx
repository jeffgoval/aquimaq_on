import React from 'react';
import { LucideIcon, PawPrint } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types';

interface PetSectionProps {
  products: Product[];
  isLoading: boolean;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  title?: string;
  icon?: LucideIcon;
}

const DEFAULT_TITLE = 'Cuidado com seus Pets';

export const PetSection: React.FC<PetSectionProps> = ({
  products,
  isLoading,
  onProductClick,
  onAddToCart,
  title = DEFAULT_TITLE,
  icon: Icon = PawPrint,
}) => {
  if (!isLoading && products.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <Icon size={26} className="text-agro-700" />
        {title}
      </h2>
      {isLoading ? (
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 hide-scrollbar">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="w-[75vw] sm:w-auto flex-shrink-0 snap-start bg-gray-100 rounded-xl h-64 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 hide-scrollbar">
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[75vw] sm:w-auto flex-shrink-0 snap-start flex"
            >
              <div className="w-full">
                <ProductCard
                  product={product}
                  onViewDetails={onProductClick}
                  onAddToCart={onAddToCart}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

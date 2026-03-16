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
      {/* Container com fundo creme-palha */}
      <div className="bg-earth-100 rounded-2xl px-6 py-8 border border-earth-200">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-earth-500/15 shrink-0">
            <Icon size={22} className="text-earth-500" />
          </div>
          <div>
            <h2 className="font-display text-2xl text-agro-900 leading-tight">
              {title}
            </h2>
            <p className="text-earth-600 text-xs mt-0.5 font-medium tracking-wide uppercase">
              Produtos selecionados para sua fazenda
            </p>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-2 px-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 hide-scrollbar">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="w-[75vw] sm:w-auto flex-shrink-0 snap-start bg-earth-200/60 rounded-xl h-64 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-2 px-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 hide-scrollbar">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="w-[75vw] sm:w-auto flex-shrink-0 snap-start flex stagger-card"
                style={{ animationDelay: `${index * 70}ms` }}
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
    </div>
  );
};

import React from 'react';
import { Flame } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from '../ProductCard';

interface CatalogFeaturedSectionProps {
    products: Product[];
    onViewDetails: (product: Product) => void;
    onAddToCart: (product: Product, quantity?: number) => void;
}

export const CatalogFeaturedSection = ({
    products,
    onViewDetails,
    onAddToCart,
}: CatalogFeaturedSectionProps) => {
    if (products.length === 0) return null;

    return (
        <div className="mb-12 animate-fade-in border-b border-gray-100 pb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Flame size={26} className="text-orange-500" /> Destaques da Semana
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.slice(0, 4).map((product) => (
                    <ProductCard
                        key={`featured-${product.id}`}
                        product={product}
                        onViewDetails={onViewDetails}
                        onAddToCart={onAddToCart}
                    />
                ))}
            </div>
        </div>
    );
};

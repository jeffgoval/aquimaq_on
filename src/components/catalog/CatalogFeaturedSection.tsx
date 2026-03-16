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
        <div className="mb-10 animate-fade-in">
            {/* Seção premium — fundo escuro com grain */}
            <div className="bg-forest-900 grain-overlay rounded-2xl px-6 py-8 shadow-xl shadow-forest-900/20">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-earth-500/20 shrink-0">
                        <Flame size={22} className="text-earth-400" />
                    </div>
                    <div>
                        <h2 className="font-display text-2xl text-white leading-tight">
                            Destaques da Semana
                        </h2>
                        <p className="text-agro-300 text-xs mt-0.5 font-medium tracking-wide uppercase">
                            Seleção especial · Melhores ofertas
                        </p>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {products.slice(0, 4).map((product, index) => (
                        <div
                            key={`featured-${product.id}`}
                            className="stagger-card"
                            style={{ animationDelay: `${index * 80}ms` }}
                        >
                            <ProductCard
                                product={product}
                                onViewDetails={onViewDetails}
                                onAddToCart={onAddToCart}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { Product } from '@/types';
import HeroBanner from '../HeroBanner';
import RecommendationsByCulture from '../RecommendationsByCulture';
import { CatalogFeaturedSection } from './CatalogFeaturedSection';

interface CatalogHeroProps {
    show: boolean;
    featuredProducts: Product[];
    onProductClick: (product: Product) => void;
    onAddToCart: (product: Product, quantity?: number) => void;
    recommendationCulture: string | null;
    onRecommendationCultureChange: (culture: string | null) => void;
    availableCultures: string[];
    culturesInSeasonThisMonth?: string[];
}

export const CatalogHero: React.FC<CatalogHeroProps> = ({
    show,
    featuredProducts,
    onProductClick,
    onAddToCart,
    recommendationCulture,
    onRecommendationCultureChange,
    availableCultures = [],
    culturesInSeasonThisMonth = [],
}) => {
    if (!show) return null;

    return (
        <>
            <HeroBanner />
            {featuredProducts.length > 0 && (
                <CatalogFeaturedSection
                    products={featuredProducts}
                    onViewDetails={onProductClick}
                    onAddToCart={onAddToCart}
                />
            )}
            <RecommendationsByCulture
                culture={recommendationCulture}
                availableCultures={availableCultures}
                onCultureChange={onRecommendationCultureChange}
                onAddToCart={onAddToCart}
                limit={8}
                showCultureSelector={true}
            />
        </>
    );
};

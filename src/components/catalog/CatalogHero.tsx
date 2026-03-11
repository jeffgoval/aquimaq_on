import React from 'react';
import { Product } from '@/types';
import HeroBanner from '../HeroBanner';
import RecommendationsByPhase from '../RecommendationsByPhase';
import { CatalogFeaturedSection } from './CatalogFeaturedSection';
import SeasonalSection from './SeasonalSection';

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
            {culturesInSeasonThisMonth.length > 0 && (
                <SeasonalSection
                    culturesInSeason={culturesInSeasonThisMonth}
                    onAddToCart={onAddToCart}
                />
            )}
            {featuredProducts.length > 0 && (
                <CatalogFeaturedSection
                    products={featuredProducts}
                    onViewDetails={onProductClick}
                    onAddToCart={onAddToCart}
                />
            )}
            <RecommendationsByPhase
                phase={recommendationCulture}
                availablePhases={availableCultures}
                onPhaseChange={onRecommendationCultureChange}
                onAddToCart={onAddToCart}
                limit={8}
                showPhaseSelector={true}
            />
        </>
    );
};

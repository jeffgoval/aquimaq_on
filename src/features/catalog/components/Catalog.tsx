import React from 'react';
import { Product, ProductCategory } from '@/types';
import type { UseCatalogFiltersResult } from '../hooks/useCatalogFilters';
import { CatalogSEO } from '@/components/catalog/CatalogSEO';
import { CatalogHero } from '@/components/catalog/CatalogHero';
import { CatalogFilterBar } from '@/components/catalog/CatalogFilterBar';
import { CatalogGrid } from '@/components/catalog/CatalogGrid';

interface CatalogProps {
    products: Product[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedCategory: ProductCategory | 'ALL';
    onCategoryChange: (category: ProductCategory | 'ALL') => void;
    onProductClick: (product: Product) => void;
    onAddToCart: (product: Product, quantity?: number) => void;
    isLoading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    filters: UseCatalogFiltersResult;
    availableCultures?: string[];
    culturesInSeasonThisMonth?: string[];
}

const getPageTitle = (
    searchQuery: string,
    selectedCategory: ProductCategory | 'ALL'
): string => {
    if (searchQuery) return `Busca: ${searchQuery} | Aquimaq`;
    if (selectedCategory !== 'ALL') return `${selectedCategory} | Aquimaq`;
    return 'Aquimaq';
};

const Catalog: React.FC<CatalogProps> = ({
    products,
    searchQuery,
    selectedCategory,
    onProductClick,
    onAddToCart,
    isLoading = false,
    error = null,
    filters,
    availableCultures = [],
    culturesInSeasonThisMonth = [],
}) => {
    const pageTitle = getPageTitle(searchQuery, selectedCategory);

    const featuredProducts = products.filter(
        (p) =>
            (p.isNew || p.isBestSeller || (p.discount != null && p.discount > 0)) &&
            !searchQuery &&
            selectedCategory === 'ALL'
    );

    const showSegmentedHome =
        selectedCategory === 'ALL' &&
        !searchQuery &&
        filters.selectedBrands.length === 0 &&
        !filters.inStock;

    const hasActiveFilters =
        searchQuery.length > 0 ||
        selectedCategory !== 'ALL' ||
        filters.selectedBrands.length > 0 ||
        filters.inStock;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CatalogSEO title={pageTitle} query={searchQuery} category={selectedCategory} />

            {showSegmentedHome && (
                <CatalogHero
                    show
                    featuredProducts={featuredProducts}
                    onProductClick={onProductClick}
                    onAddToCart={onAddToCart}
                    recommendationCulture={filters.recommendationCulture}
                    onRecommendationCultureChange={filters.onRecommendationCultureChange}
                    availableCultures={availableCultures}
                    culturesInSeasonThisMonth={culturesInSeasonThisMonth}
                />
            )}

            <div className="flex flex-col gap-6">
                <CatalogFilterBar
                    sortBy={filters.sortBy}
                    onSortChange={filters.onSortChange}
                    searchQuery={searchQuery}
                    selectedCategory={selectedCategory}
                    productCount={products.length}
                    inStock={filters.inStock}
                    onInStockChange={filters.onInStockChange}
                    inSeason={filters.inSeason}
                    onInSeasonChange={filters.onInSeasonChange}
                    showSeasonFilter={culturesInSeasonThisMonth.length > 0}
                    selectedCulture={filters.selectedCulture}
                    onCultureChange={filters.onCultureChange}
                    availableCultures={availableCultures}
                    onClearFilters={filters.clearFilters}
                />
                <CatalogGrid
                    products={products}
                    isLoading={isLoading}
                    error={error}
                    onProductClick={onProductClick}
                    onAddToCart={onAddToCart}
                    onClearFilters={filters.clearFilters}
                    hasActiveFilters={hasActiveFilters}
                />
            </div>
        </div>
    );
};

export default Catalog;

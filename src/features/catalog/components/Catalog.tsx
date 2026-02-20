import React from 'react';
import { Search } from 'lucide-react';
import { Product, ProductCategory } from '@/types';
import ProductCard from '@/components/ProductCard';
import HeroBanner from '@/components/HeroBanner';
import RecommendationsByCulture from '@/components/RecommendationsByCulture';
import { SortOption } from '../hooks/useCatalogProducts';
import type { UseCatalogFiltersResult } from '../hooks/useCatalogFilters';
import { CatalogFeaturedSection } from './catalog/CatalogFeaturedSection';
import { CatalogMobileFilterBar } from './catalog/CatalogMobileFilterBar';
import { Helmet } from 'react-helmet-async';

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

const Catalog: React.FC<CatalogProps> = ({
    products,
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    onProductClick,
    onAddToCart,
    isLoading,
    error = null,
    filters,
    availableCultures = [],
    culturesInSeasonThisMonth = [],
}) => {

    const canonicalUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
    const pageTitle = searchQuery
        ? `Busca: ${searchQuery} | Aquimaq`
        : selectedCategory !== 'ALL'
          ? `${selectedCategory} | Aquimaq`
          : 'Aquimaq';

    const featuredProducts = products.filter(
        (p) =>
            (p.isNew || p.isBestSeller || (p.discount && p.discount > 0)) &&
            !searchQuery &&
            selectedCategory === 'ALL'
    );
    const showSegmentedHome =
        selectedCategory === 'ALL' &&
        !searchQuery &&
        filters.selectedBrands.length === 0 &&
        !filters.inStock;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Helmet>
                <title>{pageTitle}</title>
                <meta
                    name="description"
                    content={`Encontre ${searchQuery || selectedCategory !== 'ALL' ? selectedCategory : 'os melhores produtos agrícolas'} na Aquimaq. Ferramentas, sementes, peças e muito mais.`}
                />
                <link rel="canonical" href={canonicalUrl} />
                {searchQuery && <meta name="robots" content="noindex, follow" />}
            </Helmet>

            {showSegmentedHome && <HeroBanner />}

            {showSegmentedHome && featuredProducts.length > 0 && (
                <CatalogFeaturedSection
                    products={featuredProducts}
                    onViewDetails={onProductClick}
                    onAddToCart={onAddToCart}
                />
            )}

            {showSegmentedHome && (
                <RecommendationsByCulture
                    culture={filters.recommendationCulture}
                    availableCultures={availableCultures}
                    onCultureChange={filters.onRecommendationCultureChange}
                    onAddToCart={onAddToCart}
                    limit={8}
                    showCultureSelector={true}
                />
            )}

            <div className="flex flex-col gap-8">
                <CatalogMobileFilterBar
                    sortBy={filters.sortBy}
                    onSortChange={filters.onSortChange}
                />

                <div className="w-full">
                    <div className="hidden lg:flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800">
                            {searchQuery
                                ? `Resultados para "${searchQuery}"`
                                : selectedCategory !== 'ALL'
                                  ? selectedCategory
                                  : 'Todos os Produtos'}
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({products.length} produtos)
                            </span>
                        </h2>

                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">Ordenar por:</span>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => filters.onSortChange(e.target.value as SortOption)}
                                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-agro-500 focus:border-agro-500 block p-2.5 outline-none cursor-pointer hover:bg-white transition-colors"
                            >
                                <option value="relevance">Relevância</option>
                                <option value="best_sellers">Mais Vendidos</option>
                                <option value="newest">Novidades</option>
                                <option value="price_asc">Menor Preço</option>
                                <option value="price_desc">Maior Preço</option>
                            </select>
                        </div>
                    </div>

                    {products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onViewDetails={onProductClick}
                                    onAddToCart={onAddToCart}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                <div
                                    key={n}
                                    className={`bg-white rounded-xl border border-gray-100 p-4 h-80 flex flex-col animate-pulse ${!isLoading && !error ? 'opacity-70' : ''}`}
                                >
                                    <div className="w-full h-40 bg-gray-200 rounded-lg mb-4" />
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                                    <div className="mt-auto h-10 bg-gray-200 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && !error && products.length === 0 && (
                        <div className="mt-8 flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <Search className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-gray-600 text-sm">
                                {searchQuery || selectedCategory !== 'ALL'
                                    ? 'Tente ajustar filtros ou busca.'
                                    : 'Catálogo vazio. Em breve teremos novidades.'}
                            </p>
                            <button
                                onClick={filters.clearFilters}
                                className="mt-4 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                            >
                                Limpar filtros
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Catalog;

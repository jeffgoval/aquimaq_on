import React, { useState } from 'react';
import { Search, Flame, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Product, ProductCategory } from '@/types';
import ProductCard from './ProductCard';
import HeroBanner from './HeroBanner';
import FilterSidebar from './FilterSidebar';
import RecommendationsByCulture from './RecommendationsByCulture';
import { SortOption } from '@/hooks/useCatalogProducts';

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
    // New Props for filtering
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    availableBrands: string[];
    selectedBrands: string[];
    onBrandChange: (brand: string) => void;
    clearFilters: () => void;
    inStock: boolean;
    onInStockChange: (inStock: boolean) => void;
    availableCultures?: string[];
    selectedCulture: string | null;
    onCultureChange: (culture: string | null) => void;
    inSeason?: boolean;
    onInSeasonChange?: (value: boolean) => void;
    culturesInSeasonThisMonth?: string[];
    recommendationCulture: string | null;
    onRecommendationCultureChange?: (culture: string | null) => void;
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
    onRetry,
    sortBy,
    onSortChange,
    availableBrands,
    selectedBrands,
    onBrandChange,
    clearFilters,
    inStock,
    onInStockChange,
    availableCultures = [],
    selectedCulture = null,
    onCultureChange,
    inSeason = false,
    onInSeasonChange,
    culturesInSeasonThisMonth = [],
    recommendationCulture = null,
    onRecommendationCultureChange
}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const canonicalUrl = window.location.href.split('?')[0];
    const pageTitle = searchQuery
        ? `Busca: ${searchQuery} | Aquimaq`
        : selectedCategory !== 'ALL'
            ? `${selectedCategory} | Aquimaq`
            : 'Aquimaq';

    const featuredProducts = products.filter(p => (p.isNew || p.isBestSeller || (p.discount && p.discount > 0)) && !searchQuery && selectedCategory === 'ALL');
    const showSegmentedHome = selectedCategory === 'ALL' && !searchQuery && selectedBrands.length === 0 && !inStock;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={`Encontre ${searchQuery || selectedCategory !== 'ALL' ? selectedCategory : 'os melhores produtos agrícolas'} na Aquimaq. Ferramentas, sementes, peças e muito mais.`} />
                <link rel="canonical" href={canonicalUrl} />
                {searchQuery && <meta name="robots" content="noindex, follow" />}
            </Helmet>

            {/* Hero Section (Only on home) */}
            {showSegmentedHome && <HeroBanner />}

            {/* Featured Section (Only shows on home) */}
            {featuredProducts.length > 0 && showSegmentedHome && (
                <div className="mb-12 animate-fade-in border-b border-gray-100 pb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Flame size={26} className="text-orange-500" /> Destaques da Semana
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredProducts.slice(0, 4).map(product => (
                            <ProductCard
                                key={`featured-${product.id}`}
                                product={product}
                                onViewDetails={onProductClick}
                                onAddToCart={onAddToCart}
                            />
                        ))}
                    </div>
                </div>
            )}

            {showSegmentedHome && (
                <RecommendationsByCulture
                    culture={recommendationCulture}
                    availableCultures={availableCultures}
                    onCultureChange={onRecommendationCultureChange}
                    onAddToCart={onAddToCart}
                    limit={8}
                    showCultureSelector={true}
                />
            )}

            <div className="flex flex-col lg:flex-row gap-8 relative items-start">
                {/* Mobile Filter Toggle */}
                <div className="lg:hidden w-full flex justify-between items-center mb-4 sticky top-16 bg-white z-10 py-2 border-b border-gray-100">
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                        <SlidersHorizontal size={18} /> Filtros
                    </button>

                    <div className="flex items-center gap-2">
                        <ArrowUpDown size={16} className="text-gray-400" />
                        <select
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value as SortOption)}
                            className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                        >
                            <option value="relevance">Relevância</option>
                            <option value="best_sellers">Mais Vendidos</option>
                            <option value="newest">Novidades</option>
                            <option value="price_asc">Menor Preço</option>
                            <option value="price_desc">Maior Preço</option>
                        </select>
                    </div>
                </div>

                {/* Sidebar */}
                <div className={`fixed inset-0 z-40 lg:relative lg:block lg:z-0 lg:w-64 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden md:hidden lg:block'}`}>
                    <FilterSidebar
                        isOpen={isFilterOpen}

                        onClose={() => setIsFilterOpen(false)}
                        availableBrands={availableBrands}
                        selectedBrands={selectedBrands}
                        onBrandChange={onBrandChange}
                        clearFilters={clearFilters}
                        inStock={inStock}
                        onInStockChange={onInStockChange}
                        availableCultures={availableCultures}
                        selectedCulture={selectedCulture}
                        onCultureChange={onCultureChange}
                        inSeason={inSeason}
                        onInSeasonChange={onInSeasonChange}
                        culturesInSeasonThisMonth={culturesInSeasonThisMonth}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1 w-full">
                    {/* Desktop Sort Bar */}
                    <div className="hidden lg:flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800">
                            {searchQuery ? `Resultados para "${searchQuery}"` : selectedCategory !== 'ALL' ? selectedCategory : 'Todos os Produtos'}
                            <span className="ml-2 text-sm font-normal text-gray-500">({products.length} produtos)</span>
                        </h2>

                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">Ordenar por:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => onSortChange(e.target.value as SortOption)}
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
                            {products.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onViewDetails={onProductClick}
                                    onAddToCart={onAddToCart}
                                />
                            ))}
                        </div>
                    ) : (
                        /* Sem produtos: loading, erro ou vazio — sempre placeholders */
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
                                {searchQuery || selectedCategory !== 'ALL' ? 'Tente ajustar filtros ou busca.' : 'Catálogo vazio. Em breve teremos novidades.'}
                            </p>
                            <button
                                onClick={clearFilters}
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


import React, { useMemo, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Catalog from '@/components/Catalog';
import TrustBar from '@/components/TrustBar';
import { useCart } from '@/contexts/CartContext';
import { ProductCategory } from '@/types';
import ErrorBoundary from '@/components/ErrorBoundary';
import { parseCategoryFromUrl } from '@/utils/urlSearch';
import { useProducts, SortOption } from '../hooks/useCatalogProducts';
import { useCropCalendar } from '../hooks/useCropCalendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 12;

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToCart } = useCart();

    // Pagination state
    const [page, setPage] = useState(1);

    // Filter states
    const [sortBy, setSortBy] = useState<SortOption>('relevance');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [inStock, setInStock] = useState(false);
    const [selectedCulture, setSelectedCulture] = useState<string | null>(null);
    const [inSeason, setInSeason] = useState(false);
    const [recommendationCulture, setRecommendationCulture] = useState<string | null>(null);

    const { cultures: availableCultures, culturesInSeasonThisMonth } = useCropCalendar();

    const searchQuery = searchParams.get('q') ?? '';
    const selectedCategory = useMemo(
        () => parseCategoryFromUrl(searchParams.get('category')),
        [searchParams]
    );

    const { products, isLoading, error, totalCount, hasMore, availableBrands } = useProducts({
        page,
        pageSize: PAGE_SIZE,
        category: selectedCategory,
        searchQuery,
        sortBy,
        selectedBrands,
        inStock,
        culture: selectedCulture,
        inSeason,
        culturesInSeason: culturesInSeasonThisMonth
    });




    const onSearchChange = useCallback((query: string) => {
        setPage(1); // Reset to page 1 on search
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (query) next.set('q', query);
            else next.delete('q');
            return next;
        });
    }, [setSearchParams]);

    const onCategoryChange = useCallback((category: ProductCategory | 'ALL') => {
        setPage(1); // Reset to page 1 on category change
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (category === 'ALL') next.delete('category');
            else next.set('category', category);
            return next;
        });
        // Clear filters on category change too
        setSelectedBrands([]);
        setInStock(false);
    }, [setSearchParams]);

    const handleNextPage = () => {
        if (hasMore) {
            setPage(p => p + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            setPage(p => p - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBrandChange = (brand: string) => {
        setPage(1);
        setSelectedBrands(prev =>
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );
    };



    const handleClearFilters = () => {
        setPage(1);
        setSelectedBrands([]);
        setSortBy('relevance');
        setInStock(false);
        setSelectedCulture(null);
        setInSeason(false);
    };

    // Calculate dynamic title/description based on state
    const getPageTitle = () => {
        if (searchQuery) return `Busca: ${searchQuery} | Aquimaq`;
        if (selectedCategory !== 'ALL') return `${selectedCategory} | Aquimaq`;
        return 'Aquimaq';
    };

    const getPageDescription = () => {
        if (searchQuery) return `Resultados para ${searchQuery} na Aquimaq.`;
        if (selectedCategory !== 'ALL') return `Confira nossa seleção de ${selectedCategory}.`;
        return 'A melhor seleção de produtos agropecuários, ferramentas e peças você encontra na Aquimaq.';
    };

    return (
        <>
            <TrustBar />

            <ErrorBoundary minimal>
                <Catalog
                    products={products}
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    selectedCategory={selectedCategory}
                    onCategoryChange={onCategoryChange}
                    onProductClick={(p) => navigate(`/produto/${p.id}`)}
                    onAddToCart={addToCart}
                    isLoading={isLoading}
                    error={error}
                    onRetry={() => window.location.reload()}
                    // Filter props
                    sortBy={sortBy}
                    onSortChange={(s) => { setSortBy(s); setPage(1); }}

                    availableBrands={availableBrands}
                    selectedBrands={selectedBrands}
                    onBrandChange={handleBrandChange}
                    clearFilters={handleClearFilters}
                    inStock={inStock}
                    onInStockChange={(val) => { setInStock(val); setPage(1); }}
                    availableCultures={availableCultures}
                    selectedCulture={selectedCulture}
                    onCultureChange={(c) => { setSelectedCulture(c); setPage(1); }}
                    inSeason={inSeason}
                    onInSeasonChange={(val) => { setInSeason(val); setPage(1); }}
                    culturesInSeasonThisMonth={culturesInSeasonThisMonth}
                    recommendationCulture={recommendationCulture}
                    onRecommendationCultureChange={setRecommendationCulture}
                />
            </ErrorBoundary>

            {/* Pagination Controls */}
            {!isLoading && products.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-4 flex justify-center items-center gap-4 bg-gray-50 rounded-b-xl mb-8">
                    <button
                        onClick={handlePrevPage}
                        disabled={page === 1}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-agro-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        <ChevronLeft size={16} />
                        Anterior
                    </button>

                    <span className="text-sm text-gray-600 font-medium">
                        Página {page} de {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
                    </span>

                    <button
                        onClick={handleNextPage}
                        disabled={!hasMore}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-agro-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        Próxima
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </>
    );
};

export default HomePage;


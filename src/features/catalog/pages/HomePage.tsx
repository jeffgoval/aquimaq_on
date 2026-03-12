import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Catalog from '../components/Catalog';
import TrustBar from '@/components/TrustBar';
import { useCart } from '@/features/cart';
import { useStore } from '@/contexts/StoreContext';
import { ProductCategory } from '@/types';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ROUTES } from '@/constants/routes';
import { parseCategoryFromUrl } from '../utils/urlSearch';
import { useProducts } from '../hooks/useCatalogProducts';
import { useCatalogFilters } from '../hooks/useCatalogFilters';
import { useCropCalendar } from '../hooks/useCropCalendar';
import ProductCard from '@/components/ProductCard';
import { ChevronLeft, ChevronRight, PawPrint } from 'lucide-react';

const PAGE_SIZE = 12;

/** Mapeia seasonal_context (admin) para nome de cultura usado em recomendações. */
const SEASONAL_CONTEXT_TO_CULTURE: Record<string, string> = {
    PLANTIO_MILHO: 'Milho',
    COLHEITA_MILHO: 'Milho',
    PLANTIO_SOJA: 'Soja',
    COLHEITA_SOJA: 'Soja',
    PLANTIO_CAFE: 'Café',
    COLHEITA_CAFE: 'Café',
};

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToCart } = useCart();
    const { settings } = useStore();
    const [page, setPage] = useState(1);

    const filters = useCatalogFilters({ onFilterChange: () => setPage(1) });

    const { cultures: availableCultures, culturesInSeasonThisMonth } = useCropCalendar();
    const seasonalContext = settings?.seasonalContext ?? null;
    const overrideCulture = seasonalContext && seasonalContext !== 'OFF' ? SEASONAL_CONTEXT_TO_CULTURE[seasonalContext] : null;

    // Quando há modo de safra definido no admin, usa a cultura mapeada para recomendações
    useEffect(() => {
        if (overrideCulture) {
            filters.onRecommendationCultureChange(overrideCulture);
        }
    }, [overrideCulture]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-seleciona a primeira fase da safra do mês atual quando o calendário carrega (se não houver override)
    useEffect(() => {
        if (overrideCulture) return;
        if (culturesInSeasonThisMonth.length > 0 && !filters.recommendationCulture) {
            filters.onRecommendationCultureChange(culturesInSeasonThisMonth[0]);
        }
    }, [culturesInSeasonThisMonth, overrideCulture]); // eslint-disable-line react-hooks/exhaustive-deps

    const { products: petProducts, isLoading: isPetLoading } = useProducts({
        category: ProductCategory.PET,
        pageSize: 4,
        page: 1,
    });

    const searchQuery = searchParams.get('q') ?? '';
    const selectedCategory = useMemo(
        () => parseCategoryFromUrl(searchParams.get('category')),
        [searchParams]
    );

    const { products, isLoading, error, totalCount, hasMore } = useProducts({
        page,
        pageSize: PAGE_SIZE,
        category: selectedCategory,
        searchQuery,
        sortBy: filters.sortBy,
        selectedBrands: filters.selectedBrands,
        inStock: filters.inStock,
        culture: filters.selectedCulture,
        inSeason: filters.inSeason,
        culturesInSeason: culturesInSeasonThisMonth,
    });

    const onSearchChange = useCallback((query: string) => {
        setPage(1);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (query) next.set('q', query);
            else next.delete('q');
            return next;
        });
    }, [setSearchParams]);

    const onCategoryChange = useCallback(
        (category: ProductCategory | 'ALL') => {
            setPage(1);
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (category === 'ALL') next.delete('category');
                else next.set('category', category);
                return next;
            });
            filters.clearFilters();
        },
        [setSearchParams, filters]
    );

    const handleNextPage = () => {
        if (hasMore) {
            setPage((p) => p + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            setPage((p) => p - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
                    onProductClick={(p) => navigate(ROUTES.PRODUCT(p.id))}
                    onAddToCart={addToCart}
                    isLoading={isLoading}
                    error={error}
                    onRetry={() => window.location.reload()}
                    filters={filters}
                    availableCultures={availableCultures}
                    culturesInSeasonThisMonth={culturesInSeasonThisMonth}
                />
            </ErrorBoundary>

            {/* Seção Linha Pet */}
            {(isPetLoading || petProducts.length > 0) && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 animate-fade-in">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                        <PawPrint size={26} className="text-agro-700" />
                        Cuidado com seus Pets
                    </h2>
                    {isPetLoading ? (
                        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 hide-scrollbar">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="w-[75vw] sm:w-auto flex-shrink-0 snap-start bg-gray-100 rounded-xl h-64 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 hide-scrollbar">
                            {petProducts.map((product) => (
                                <div key={product.id} className="w-[75vw] sm:w-auto flex-shrink-0 snap-start flex">
                                    <div className="w-full">
                                        <ProductCard
                                            product={product}
                                            onViewDetails={(p) => navigate(ROUTES.PRODUCT(p.id))}
                                            onAddToCart={addToCart}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {!isLoading && products.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-2">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-gray-100 pt-6">
                        <span className="text-sm text-gray-400 order-2 sm:order-1">
                            Mostrando{' '}
                            <span className="font-semibold text-gray-600">
                                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)}
                            </span>
                            {' '}de{' '}
                            <span className="font-semibold text-gray-600">{totalCount}</span>
                            {' '}produtos
                        </span>

                        <div className="flex items-center gap-2 order-1 sm:order-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={page === 1}
                                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-agro-50 hover:text-agro-700 hover:border-agro-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ChevronLeft size={15} />
                                Anterior
                            </button>

                            <span className="text-sm text-gray-500 px-2 font-medium">
                                {page} / {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
                            </span>

                            <button
                                onClick={handleNextPage}
                                disabled={!hasMore}
                                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-agro-50 hover:text-agro-700 hover:border-agro-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Próxima
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HomePage;

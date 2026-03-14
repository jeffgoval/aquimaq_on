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
import { PetSection } from '../components/PetSection';
import { CatalogPagination } from '@/components/catalog/CatalogPagination';

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

            <PetSection
                products={petProducts}
                isLoading={isPetLoading}
                onProductClick={(p) => navigate(ROUTES.PRODUCT(p.id))}
                onAddToCart={addToCart}
            />

            {!isLoading && products.length > 0 && (
                <CatalogPagination
                    currentPage={page}
                    totalCount={totalCount}
                    pageSize={PAGE_SIZE}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                    hasMore={hasMore}
                />
            )}
        </>
    );
};

export default HomePage;

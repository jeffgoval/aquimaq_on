import { useState, useCallback } from 'react';
import { SortOption } from './useCatalogProducts';

export interface UseCatalogFiltersOptions {
    onFilterChange?: () => void;
}

export interface UseCatalogFiltersResult {
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    selectedBrands: string[];
    onBrandChange: (brand: string) => void;
    clearFilters: () => void;
    inStock: boolean;
    onInStockChange: (value: boolean) => void;
    selectedCulture: string | null;
    onCultureChange: (culture: string | null) => void;
    inSeason: boolean;
    onInSeasonChange: (value: boolean) => void;
    recommendationCulture: string | null;
    onRecommendationCultureChange: (culture: string | null) => void;
}

export const useCatalogFilters = (
    options: UseCatalogFiltersOptions = {}
): UseCatalogFiltersResult => {
    const { onFilterChange } = options;

    const [sortBy, setSortBy] = useState<SortOption>('relevance');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [inStock, setInStock] = useState(false);
    const [selectedCulture, setSelectedCulture] = useState<string | null>(null);
    const [inSeason, setInSeason] = useState(false);
    const [recommendationCulture, setRecommendationCulture] = useState<string | null>(null);

    const onSortChange = useCallback(
        (sort: SortOption) => {
            setSortBy(sort);
            onFilterChange?.();
        },
        [onFilterChange]
    );

    const onBrandChange = useCallback(
        (brand: string) => {
            setSelectedBrands((prev) =>
                prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
            );
            onFilterChange?.();
        },
        [onFilterChange]
    );

    const clearFilters = useCallback(() => {
        setSortBy('relevance');
        setSelectedBrands([]);
        setInStock(false);
        setSelectedCulture(null);
        setInSeason(false);
        onFilterChange?.();
    }, [onFilterChange]);

    const onInStockChange = useCallback(
        (value: boolean) => {
            setInStock(value);
            onFilterChange?.();
        },
        [onFilterChange]
    );

    const onCultureChange = useCallback(
        (culture: string | null) => {
            setSelectedCulture(culture);
            onFilterChange?.();
        },
        [onFilterChange]
    );

    const onInSeasonChange = useCallback(
        (value: boolean) => {
            setInSeason(value);
            onFilterChange?.();
        },
        [onFilterChange]
    );

    const onRecommendationCultureChange = useCallback((culture: string | null) => {
        setRecommendationCulture(culture);
    }, []);

    return {
        sortBy,
        onSortChange,
        selectedBrands,
        onBrandChange,
        clearFilters,
        inStock,
        onInStockChange,
        selectedCulture,
        onCultureChange,
        inSeason,
        onInSeasonChange,
        recommendationCulture,
        onRecommendationCultureChange,
    };
};

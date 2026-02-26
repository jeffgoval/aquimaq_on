import React from 'react';
import { X } from 'lucide-react';
import { ProductCategory } from '@/types';
import { SortOption } from '@/hooks/useCatalogProducts';
import { CatalogMobileFilterBar } from './CatalogMobileFilterBar';

interface CatalogFilterBarProps {
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    searchQuery: string;
    selectedCategory: ProductCategory | 'ALL';
    productCount: number;
    // Inline filters
    inStock: boolean;
    onInStockChange: (v: boolean) => void;
    inSeason: boolean;
    onInSeasonChange: (v: boolean) => void;
    showSeasonFilter: boolean;
    selectedCulture: string | null;
    onCultureChange: (c: string | null) => void;
    availableCultures: string[];
    onClearFilters: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'relevance', label: 'Relevância' },
    { value: 'best_sellers', label: 'Mais Vendidos' },
    { value: 'newest', label: 'Novidades' },
    { value: 'price_asc', label: 'Menor Preço' },
    { value: 'price_desc', label: 'Maior Preço' },
];

const getSectionTitle = (searchQuery: string, selectedCategory: ProductCategory | 'ALL'): string => {
    if (searchQuery) return `Resultados para "${searchQuery}"`;
    if (selectedCategory !== 'ALL') return selectedCategory;
    return 'Todos os Produtos';
};

export const CatalogFilterBar: React.FC<CatalogFilterBarProps> = ({
    sortBy,
    onSortChange,
    searchQuery,
    selectedCategory,
    productCount,
    inStock,
    onInStockChange,
    inSeason,
    onInSeasonChange,
    showSeasonFilter,
    selectedCulture,
    onCultureChange,
    availableCultures,
    onClearFilters,
}) => {
    const activeFilterCount = [inStock, inSeason, !!selectedCulture].filter(Boolean).length;

    return (
        <>
            {/* Mobile */}
            <CatalogMobileFilterBar
                sortBy={sortBy}
                onSortChange={onSortChange}
                inStock={inStock}
                onInStockChange={onInStockChange}
                inSeason={inSeason}
                onInSeasonChange={onInSeasonChange}
                showSeasonFilter={showSeasonFilter}
                selectedCulture={selectedCulture}
                onCultureChange={onCultureChange}
                availableCultures={availableCultures}
            />

            {/* Desktop */}
            <div className="hidden lg:block border-b border-gray-100 pb-4 mb-2">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Left: title + count */}
                    <div className="flex items-center gap-3 shrink-0">
                        <h2 className="text-xl font-bold text-gray-800">
                            {getSectionTitle(searchQuery, selectedCategory)}
                        </h2>
                        <span className="text-sm text-gray-400 font-medium">
                            {productCount} produto{productCount !== 1 ? 's' : ''}
                        </span>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={onClearFilters}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors border border-gray-200 hover:border-red-200 px-2 py-1 rounded-full"
                            >
                                <X size={11} /> Limpar filtros
                            </button>
                        )}
                    </div>

                    {/* Right: filter chips + sort */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Em Estoque chip */}
                        <button
                            onClick={() => onInStockChange(!inStock)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${inStock
                                ? 'bg-agro-600 text-white border-agro-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-agro-300 hover:text-agro-600'
                                }`}
                        >
                            Em Estoque
                        </button>

                        {/* Na Estação chip */}
                        {showSeasonFilter && (
                            <button
                                onClick={() => onInSeasonChange(!inSeason)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${inSeason
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600'
                                    }`}
                            >
                                🌱 Na Estação
                            </button>
                        )}

                        {/* Cultura select */}
                        {availableCultures.length > 0 && (
                            <select
                                value={selectedCulture ?? ''}
                                onChange={(e) => onCultureChange(e.target.value || null)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full border outline-none cursor-pointer transition-all ${selectedCulture
                                    ? 'bg-agro-50 text-agro-700 border-agro-300'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-agro-300'
                                    }`}
                            >
                                <option value="">Cultura</option>
                                {availableCultures.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        )}

                        <div className="w-px h-5 bg-gray-200 mx-1" />

                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Ordenar:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => onSortChange(e.target.value as SortOption)}
                                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-agro-500 focus:border-agro-500 px-3 py-1.5 outline-none cursor-pointer hover:border-agro-300 transition-colors"
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

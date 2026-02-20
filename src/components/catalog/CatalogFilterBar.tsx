import React from 'react';
import { Filter } from 'lucide-react';
import { ProductCategory } from '@/types';
import { SortOption } from '@/hooks/useCatalogProducts';
import { CatalogMobileFilterBar } from './CatalogMobileFilterBar';

interface CatalogFilterBarProps {
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    searchQuery: string;
    selectedCategory: ProductCategory | 'ALL';
    productCount: number;
    onOpenFilters?: () => void;
    showFiltersButton?: boolean;
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
    onOpenFilters,
    showFiltersButton = false,
}) => (
    <>
        <CatalogMobileFilterBar sortBy={sortBy} onSortChange={onSortChange} />
        <div className="hidden lg:flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">
                {getSectionTitle(searchQuery, selectedCategory)}
                <span className="ml-2 text-sm font-normal text-gray-500">
                    ({productCount} produtos)
                </span>
            </h2>
            <div className="flex items-center gap-3">
                {showFiltersButton && onOpenFilters && (
                    <button
                        type="button"
                        onClick={onOpenFilters}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
                    >
                        <Filter size={16} />
                        Filtros
                    </button>
                )}
                <span className="text-sm text-gray-500">Ordenar por:</span>
                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value as SortOption)}
                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-agro-500 focus:border-agro-500 block p-2.5 outline-none cursor-pointer hover:bg-white transition-colors"
                >
                    {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    </>
);

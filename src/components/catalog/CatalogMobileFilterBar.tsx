import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { SortOption } from '@/hooks/useCatalogProducts';

interface CatalogMobileFilterBarProps {
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    inStock: boolean;
    onInStockChange: (v: boolean) => void;
    inSeason: boolean;
    onInSeasonChange: (v: boolean) => void;
    showSeasonFilter: boolean;
    selectedCulture: string | null;
    onCultureChange: (c: string | null) => void;
    availableCultures: string[];
}

export const CatalogMobileFilterBar: React.FC<CatalogMobileFilterBarProps> = ({
    sortBy,
    onSortChange,
    inStock,
    onInStockChange,
    inSeason,
    onInSeasonChange,
    showSeasonFilter,
    selectedCulture,
    onCultureChange,
    availableCultures,
}) => (
    <div className="lg:hidden w-full sticky top-16 bg-white z-10 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide">
            {/* Sort */}
            <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-gray-200">
                <ArrowUpDown size={14} className="text-gray-400 shrink-0" />
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

            {/* Em Estoque chip */}
            <button
                onClick={() => onInStockChange(!inStock)}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${inStock
                    ? 'bg-agro-600 text-white border-agro-600'
                    : 'bg-white text-gray-600 border-gray-200'
                    }`}
            >
                Em Estoque
            </button>

            {/* Na Estação chip */}
            {showSeasonFilter && (
                <button
                    onClick={() => onInSeasonChange(!inSeason)}
                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${inSeason
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-600 border-gray-200'
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
                    className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border outline-none cursor-pointer whitespace-nowrap ${selectedCulture
                        ? 'bg-agro-50 text-agro-700 border-agro-300'
                        : 'bg-white text-gray-600 border-gray-200'
                        }`}
                >
                    <option value="">Cultura</option>
                    {availableCultures.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            )}
        </div>
    </div>
);

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { SortOption } from '../../hooks/useCatalogProducts';

interface CatalogMobileFilterBarProps {
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
}

export const CatalogMobileFilterBar = ({
    sortBy,
    onSortChange,
}: CatalogMobileFilterBarProps) => (
    <div className="lg:hidden w-full flex justify-end items-center mb-4 sticky top-16 bg-white z-10 py-2 border-b border-gray-100">
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
);

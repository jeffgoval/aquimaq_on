import React, { useState, useEffect } from 'react';
import { X, Filter, Sprout } from 'lucide-react';

interface FilterSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    availableBrands: string[];
    selectedBrands: string[];
    onBrandChange: (brand: string) => void;
    clearFilters: () => void;
    inStock?: boolean;
    onInStockChange?: (inStock: boolean) => void;
    /** Filtro por cultura e "Na safra agora" */
    availableCultures?: string[];
    selectedCulture: string | null;
    onCultureChange: (culture: string | null) => void;
    inSeason?: boolean;
    onInSeasonChange?: (value: boolean) => void;
    culturesInSeasonThisMonth?: string[];
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
    isOpen,
    onClose,
    availableBrands,
    selectedBrands,
    onBrandChange,
    clearFilters,
    inStock = false,
    onInStockChange,
    availableCultures = [],
    selectedCulture,
    onCultureChange,
    inSeason = false,
    onInSeasonChange,
    culturesInSeasonThisMonth = []
}) => {


    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 lg:shadow-none lg:block ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-full overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-6 lg:hidden">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Filter size={20} /> Filtros
                        </h2>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Culture & In Season */}
                        {(availableCultures.length > 0 || (onInSeasonChange && culturesInSeasonThisMonth.length > 0)) && (
                            <>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Sprout size={16} /> Cultura
                                    </h3>
                                    <div className="space-y-2">
                                        <select
                                            value={selectedCulture ?? ''}
                                            onChange={(e) => onCultureChange(e.target.value || null)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:border-agro-500 focus:ring-1 focus:ring-agro-500 outline-none bg-white"
                                        >
                                            <option value="">Todas</option>
                                            {availableCultures.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        {onInSeasonChange && culturesInSeasonThisMonth.length > 0 && (
                                            <label className="flex items-center gap-3 cursor-pointer group mt-3">
                                                <input
                                                    type="checkbox"
                                                    checked={inSeason}
                                                    onChange={(e) => onInSeasonChange(e.target.checked)}
                                                    className="w-4 h-4 border-2 border-gray-300 rounded text-agro-600 focus:ring-agro-500 transition-colors"
                                                />
                                                <span className="text-sm text-gray-600 group-hover:text-gray-900">
                                                    Na safra agora
                                                </span>
                                            </label>
                                        )}
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100" />
                            </>
                        )}

                        {/* Availability Filter */}
                        {onInStockChange && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                                    Disponibilidade
                                </h3>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={inStock}
                                            onChange={(e) => onInStockChange(e.target.checked)}
                                            className="peer w-4 h-4 border-2 border-gray-300 rounded text-agro-600 focus:ring-agro-500 transition-colors"
                                        />
                                    </div>
                                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                        Apenas em Estoque
                                    </span>
                                </label>
                            </div>
                        )}

                        {onInStockChange && <div className="h-px bg-gray-100" />}

                        {/* Price Filter */}


                        {/* Brand Filter */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                                Marcas
                            </h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {availableBrands.length > 0 ? availableBrands.map((brand) => (
                                    <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedBrands.includes(brand)}
                                                onChange={() => onBrandChange(brand)}
                                                className="peer w-4 h-4 border-2 border-gray-300 rounded text-agro-600 focus:ring-agro-500 transition-colors"
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                            {brand}
                                        </span>
                                    </label>
                                )) : (
                                    <p className="text-sm text-gray-400 italic">Nenhuma marca disponível</p>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        <button
                            onClick={clearFilters}
                            className="w-full py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default FilterSidebar;

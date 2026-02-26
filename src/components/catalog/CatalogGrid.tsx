import React from 'react';
import { Search } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from '../ProductCard';

interface CatalogGridProps {
    products: Product[];
    isLoading: boolean;
    error: string | null;
    onProductClick: (product: Product) => void;
    onAddToCart: (product: Product, quantity?: number) => void;
    onClearFilters?: () => void;
    hasActiveFilters: boolean;
}

const SKELETON_COUNT = 8;

const ProductGridSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: SKELETON_COUNT }, (_, n) => (
            <div
                key={n}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col animate-pulse"
            >
                <div className="w-full h-52 bg-gray-200" />
                <div className="p-4 flex flex-col gap-2">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="mt-2 h-6 bg-gray-200 rounded w-2/5" />
                    <div className="mt-1 h-9 bg-gray-200 rounded-lg" />
                </div>
            </div>
        ))}
    </div>
);

const EmptyState: React.FC<{
    searchOrCategory: boolean;
    onClearFilters?: () => void;
}> = ({ searchOrCategory, onClearFilters }) => (
    <div className="mt-8 flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <Search className="w-10 h-10 text-gray-400 mb-2" />
        <p className="text-gray-600 text-sm">
            {searchOrCategory
                ? 'Tente ajustar filtros ou busca.'
                : 'Catálogo vazio. Em breve teremos novidades.'}
        </p>
        {onClearFilters && (
            <button
                type="button"
                onClick={onClearFilters}
                className="mt-4 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
                Limpar filtros
            </button>
        )}
    </div>
);

export const CatalogGrid: React.FC<CatalogGridProps> = ({
    products,
    isLoading,
    error,
    onProductClick,
    onAddToCart,
    onClearFilters,
    hasActiveFilters,
}) => {
    const showEmpty = !isLoading && !error && products.length === 0;
    const showSkeletons = isLoading || (products.length === 0 && !!error);

    return (
        <div className="w-full">
            {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onViewDetails={onProductClick}
                            onAddToCart={onAddToCart}
                        />
                    ))}
                </div>
            ) : showSkeletons ? (
                <ProductGridSkeleton />
            ) : null}

            {showEmpty && (
                <EmptyState
                    searchOrCategory={hasActiveFilters}
                    onClearFilters={hasActiveFilters ? onClearFilters : undefined}
                />
            )}
        </div>
    );
};

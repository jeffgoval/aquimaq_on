import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { Product } from '@/types';
import { ROUTES } from '@/constants/routes';
import { useProducts } from '@/hooks/useCatalogProducts';
import ProductCard from '@/components/ProductCard';
import { MONTHS_FULL } from '@/utils/cropCalendar';

interface SeasonalSectionProps {
    culturesInSeason: string[];
    onAddToCart: (product: Product, quantity?: number) => void;
}

const SeasonalSection: React.FC<SeasonalSectionProps> = ({ culturesInSeason, onAddToCart }) => {
    const navigate = useNavigate();
    const currentMonth = new Date().getMonth(); // 0-indexed para MONTHS_FULL
    const monthName = MONTHS_FULL[currentMonth];

    const { products, isLoading } = useProducts({
        inSeason: true,
        culturesInSeason,
        pageSize: 8,
        page: 1,
    });

    if (!isLoading && products.length === 0) return null;

    return (
        <div className="mt-8 mb-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100">
                            <Leaf size={20} className="text-emerald-600" />
                        </span>
                        Em Safra Agora
                        <span className="text-lg font-normal text-gray-400">· {monthName}</span>
                    </h2>
                    {culturesInSeason.length > 0 && (
                        <p className="mt-1 text-sm text-gray-500 ml-11">
                            Culturas:{' '}
                            <span className="font-medium text-emerald-700">
                                {culturesInSeason.join(', ')}
                            </span>
                        </p>
                    )}
                </div>
                <span className="ml-11 sm:ml-0 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Período ideal de compra
                </span>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onViewDetails={(p) => navigate(ROUTES.PRODUCT(p.id))}
                            onAddToCart={onAddToCart}
                            seasonalStatus="em_safra"
                        />
                    ))}
                </div>
            )}

            <div className="mt-6 border-b border-gray-100" />
        </div>
    );
};

export default SeasonalSection;

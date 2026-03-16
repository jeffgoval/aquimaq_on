import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { Product } from '@/types';
import { ROUTES } from '@/constants/routes';
import { useProducts } from '@/features/catalog';
import ProductCard from '@/components/ProductCard';
import { MONTHS_FULL } from '@/utils/cropCalendar';

interface SeasonalSectionProps {
    culturesInSeason: string[];
    onAddToCart: (product: Product, quantity?: number) => void;
}

const SeasonalSection: React.FC<SeasonalSectionProps> = ({ culturesInSeason, onAddToCart }) => {
    const navigate = useNavigate();
    const currentMonth = new Date().getMonth();
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
            <div className="bg-forest-800 grain-overlay rounded-2xl px-6 py-8 shadow-lg shadow-forest-900/30">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                        <h2 className="font-display text-2xl text-white flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-agro-600/30 shrink-0">
                                <Leaf size={20} className="text-agro-300" />
                            </span>
                            Em Safra Agora
                            <span className="text-lg font-sans font-normal text-agro-300">· {monthName}</span>
                        </h2>
                        {culturesInSeason.length > 0 && (
                            <p className="mt-1.5 text-sm text-agro-200 ml-[52px]">
                                Culturas:{' '}
                                <span className="font-semibold text-white">
                                    {culturesInSeason.join(', ')}
                                </span>
                            </p>
                        )}
                    </div>
                    <span className="ml-[52px] sm:ml-0 inline-flex items-center gap-1.5 bg-agro-600/20 border border-agro-600/40 text-agro-200 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0">
                        <span className="w-2 h-2 rounded-full bg-agro-400 animate-pulse" />
                        Período ideal de compra
                    </span>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-2 px-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 hide-scrollbar">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="w-[75vw] sm:w-auto flex-shrink-0 snap-start bg-forest-700/50 rounded-xl h-64 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-2 px-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 hide-scrollbar">
                        {products.map((product, index) => (
                            <div
                                key={product.id}
                                className="w-[75vw] sm:w-auto flex-shrink-0 snap-start flex stagger-card"
                                style={{ animationDelay: `${index * 70}ms` }}
                            >
                                <div className="w-full">
                                    <ProductCard
                                        product={product}
                                        onViewDetails={(p) => navigate(ROUTES.PRODUCT(p.id))}
                                        onAddToCart={onAddToCart}
                                        seasonalStatus="em_safra"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeasonalSection;

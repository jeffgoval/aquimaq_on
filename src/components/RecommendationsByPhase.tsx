import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types';
import { ROUTES } from '@/constants/routes';
import { useProducts } from '@/features/catalog';
import ProductCard from './ProductCard';
import { CalendarDays } from 'lucide-react';

export interface RecommendationsByPhaseProps {
  /** Fase da lavoura para filtrar (ex.: Floração, Colheita). Se null, mostra selector. */
  phase: string | null;
  /** Lista de fases para o dropdown */
  availablePhases: string[];
  /** Callback quando o usuário seleciona outra fase no dropdown */
  onPhaseChange?: (phase: string | null) => void;
  /** Excluir este produto da lista (ex.: na PDP) */
  excludeProductId?: string;
  onAddToCart: (product: Product, quantity?: number) => void;
  limit?: number;
  /** Se true, mostra selector de fase mesmo quando phase está preenchido (ex.: na Home) */
  showPhaseSelector?: boolean;
}

const RecommendationsByPhase: React.FC<RecommendationsByPhaseProps> = ({
  phase,
  availablePhases,
  onPhaseChange,
  excludeProductId,
  onAddToCart,
  limit = 8,
  showPhaseSelector = false
}) => {
  const navigate = useNavigate();
  const { products, isLoading } = useProducts({
    culture: phase ?? undefined,
    pageSize: limit,
    page: 1
  });

  const list = excludeProductId
    ? products.filter((p) => p.id !== excludeProductId)
    : products;

  const showBlock = showPhaseSelector || phase;
  if (!showBlock && availablePhases.length === 0) return null;

  return (
    <div className="mb-12 animate-fade-in border-b border-gray-100 pb-8">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays size={26} className="text-agro-700" />
          {phase
            ? `Recomendados para a fase de ${phase}`
            : 'Fases de Cultivo'}
        </h2>
        {(showPhaseSelector || !phase) && availablePhases.length > 0 && onPhaseChange && (
          <select
            value={phase ?? ''}
            onChange={(e) => onPhaseChange(e.target.value || null)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:border-agro-500 focus:ring-2 focus:ring-agro-500/20 outline-none bg-white font-medium cursor-pointer hover:border-gray-300 transition-colors"
          >
            <option value="">Selecione a fase da lavoura...</option>
            {availablePhases.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
      </div>

      {!phase ? (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <CalendarDays size={32} className="text-agro-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Acompanhe o ciclo da sua lavoura
          </h3>
          <p className="text-gray-500 max-w-sm">
            Selecione a fase da lavoura acima para descobrir os melhores equipamentos e insumos recomendados para o período.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 hide-scrollbar">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="w-[75vw] sm:w-auto flex-shrink-0 snap-start bg-gray-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <CalendarDays size={32} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">
            Nenhum produto em destaque para esta fase no momento.
          </p>
        </div>
      ) : (
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 hide-scrollbar">
          {list.slice(0, limit).map((product) => (
            <div key={product.id} className="w-[75vw] sm:w-auto flex-shrink-0 snap-start flex">
              <div className="w-full">
                <ProductCard
                  product={product}
                  onViewDetails={(p) => navigate(ROUTES.PRODUCT(p.id))}
                  onAddToCart={onAddToCart}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationsByPhase;

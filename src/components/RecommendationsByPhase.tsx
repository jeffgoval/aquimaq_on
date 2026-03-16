import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types';
import { ROUTES } from '@/constants/routes';
import { useProducts } from '@/features/catalog';
import ProductCard from './ProductCard';
import { CalendarDays, Sprout } from 'lucide-react';

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
    <div className="mb-12 animate-fade-in pb-8 border-b border-earth-200">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-agro-100 shrink-0">
            <CalendarDays size={22} className="text-agro-700" />
          </div>
          <h2 className="font-display text-2xl text-agro-900">
            {phase
              ? `Recomendados · ${phase}`
              : 'Fases de Cultivo'}
          </h2>
        </div>
        {(showPhaseSelector || !phase) && availablePhases.length > 0 && onPhaseChange && (
          <select
            value={phase ?? ''}
            onChange={(e) => onPhaseChange(e.target.value || null)}
            className="px-4 py-2 border border-agro-200 rounded-xl text-sm text-agro-800 font-semibold focus:border-agro-500 focus:ring-2 focus:ring-agro-500/20 outline-none bg-agro-50 cursor-pointer hover:border-agro-400 transition-colors"
          >
            <option value="">Selecione a fase da lavoura...</option>
            {availablePhases.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
      </div>

      {/* Empty — nenhuma fase selecionada */}
      {!phase ? (
        <div className="bg-agro-50 border border-agro-100 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 border border-agro-100">
            <Sprout size={30} className="text-agro-600" />
          </div>
          <h3 className="text-base font-semibold text-agro-900 mb-1">
            Acompanhe o ciclo da sua lavoura
          </h3>
          <p className="text-agro-700/70 text-sm max-w-sm">
            Selecione a fase acima para descobrir os melhores equipamentos e insumos para o período.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 hide-scrollbar">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="w-[75vw] sm:w-auto flex-shrink-0 snap-start bg-agro-50 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-agro-50 border border-agro-100 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 border border-agro-100">
            <CalendarDays size={30} className="text-agro-300" />
          </div>
          <p className="text-agro-700/70 font-medium text-sm">
            Nenhum produto em destaque para esta fase no momento.
          </p>
        </div>
      ) : (
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0 hide-scrollbar">
          {list.slice(0, limit).map((product, index) => (
            <div
              key={product.id}
              className="w-[75vw] sm:w-auto flex-shrink-0 snap-start flex stagger-card"
              style={{ animationDelay: `${index * 60}ms` }}
            >
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

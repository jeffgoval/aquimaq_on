import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types';
import { ROUTES } from '@/constants/routes';
import { useProducts } from '@/hooks/useCatalogProducts';
import ProductCard from './ProductCard';
import { Sprout } from 'lucide-react';

export interface RecommendationsByCultureProps {
  /** Cultura para filtrar (ex.: Soja, Milho). Se null, mostra selector. */
  culture: string | null;
  /** Lista de culturas para o dropdown */
  availableCultures: string[];
  /** Callback quando o usuário seleciona outra cultura no dropdown */
  onCultureChange?: (culture: string | null) => void;
  /** Excluir este produto da lista (ex.: na PDP) */
  excludeProductId?: string;
  onAddToCart: (product: Product, quantity?: number) => void;
  limit?: number;
  /** Se true, mostra selector de cultura mesmo quando culture está preenchido (ex.: na Home) */
  showCultureSelector?: boolean;
}

const RecommendationsByCulture: React.FC<RecommendationsByCultureProps> = ({
  culture,
  availableCultures,
  onCultureChange,
  excludeProductId,
  onAddToCart,
  limit = 8,
  showCultureSelector = false
}) => {
  const navigate = useNavigate();
  const { products, isLoading } = useProducts({
    culture: culture ?? undefined,
    pageSize: limit,
    page: 1
  });

  const list = excludeProductId
    ? products.filter((p) => p.id !== excludeProductId)
    : products;

  const showBlock = showCultureSelector || culture;
  if (!showBlock && availableCultures.length === 0) return null;

  return (
    <div className="mb-12 animate-fade-in border-b border-gray-100 pb-8">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sprout size={26} className="text-agro-600" />
          {culture
            ? `Recomendados para ${culture}`
            : 'Recomendados por cultura'}
        </h2>
        {(showCultureSelector || !culture) && availableCultures.length > 0 && onCultureChange && (
          <select
            value={culture ?? ''}
            onChange={(e) => onCultureChange(e.target.value || null)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:border-agro-500 focus:ring-1 focus:ring-agro-500 outline-none bg-white"
          >
            <option value="">Selecione uma cultura</option>
            {availableCultures.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {!culture ? (
        <p className="text-gray-500 text-sm">
          Selecione uma cultura para ver produtos recomendados.
        </p>
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Nenhum produto encontrado para esta cultura no momento.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {list.slice(0, limit).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={(p) => navigate(ROUTES.PRODUCT(p.id))}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationsByCulture;

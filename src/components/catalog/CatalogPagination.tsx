import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CatalogPaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
  hasMore: boolean;
}

export const CatalogPagination: React.FC<CatalogPaginationProps> = ({
  currentPage,
  totalCount,
  pageSize,
  onPrev,
  onNext,
  hasMore,
}) => {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-2">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-earth-200 pt-6">
        <span className="text-sm text-gray-400 order-2 sm:order-1">
          Mostrando{' '}
          <span className="font-semibold text-gray-700">{start}–{end}</span>
          {' '}de{' '}
          <span className="font-semibold text-gray-700">{totalCount}</span>
          {' '}produtos
        </span>

        <div className="flex items-center gap-2 order-1 sm:order-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-agro-700 hover:text-white hover:border-agro-700 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft size={15} />
            Anterior
          </button>

          <span className="text-sm font-semibold text-agro-700 bg-agro-50 border border-agro-200 px-3 py-2 rounded-lg min-w-[80px] text-center">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={onNext}
            disabled={!hasMore}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-agro-700 hover:text-white hover:border-agro-700 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Próxima
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

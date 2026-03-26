import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OrdersPaginationProps {
    safePage: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
}

export const OrdersPagination: React.FC<OrdersPaginationProps> = ({
    safePage,
    totalPages,
    totalCount,
    onPageChange,
}) => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
        .reduce<(number | '...')[]>((acc, p, idx, arr) => {
            if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1)
                acc.push('...');
            acc.push(p);
            return acc;
        }, []);

    return (
        <div className="flex items-center justify-between text-xs text-stone-500">
            <span>
                {totalCount} pedido{totalCount !== 1 ? 's' : ''} — página {safePage} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(Math.max(1, safePage - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Página anterior"
                >
                    <ChevronLeft size={16} />
                </button>
                {pages.map((p, idx) =>
                    p === '...'
                        ? <span key={`ellipsis-${idx}`} className="px-1">…</span>
                        : <button
                            key={p}
                            onClick={() => onPageChange(p as number)}
                            className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${safePage === p ? 'bg-stone-900 text-white' : 'hover:bg-stone-100'}`}
                        >
                            {p}
                        </button>
                )}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Próxima página"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

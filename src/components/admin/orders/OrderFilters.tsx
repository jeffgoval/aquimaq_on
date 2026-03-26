import React from 'react';
import { Search, Download, RefreshCw } from 'lucide-react';
import { ORDER_STATUS_OPTIONS } from '@/constants/orderStatus';

interface OrderFiltersProps {
    searchQuery: string;
    statusFilter: string;
    onSearchChange: (value: string) => void;
    onStatusFilterChange: (value: string) => void;
    onExportCSV: () => void;
    onRefresh: () => void;
    exportDisabled: boolean;
    orderCount: number;
    message: { type: 'success' | 'error'; text: string } | null;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
    searchQuery,
    statusFilter,
    onSearchChange,
    onStatusFilterChange,
    onExportCSV,
    onRefresh,
    exportDisabled,
    orderCount,
    message,
}) => (
    <>
        {/* Toolbar */}
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-lg font-semibold text-stone-800">Pedidos</h1>
                <p className="text-xs text-stone-500 mt-0.5">
                    {orderCount} pedido{orderCount !== 1 ? 's' : ''} cadastrado{orderCount !== 1 ? 's' : ''}
                </p>
            </div>
            <div className="flex items-center gap-3">
                {message && (
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {message.text}
                    </span>
                )}
                <button
                    onClick={onExportCSV}
                    disabled={exportDisabled}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Exportar pedidos filtrados em CSV"
                >
                    <Download size={14} />
                    Exportar CSV
                </button>
                <button
                    onClick={onRefresh}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                >
                    <RefreshCw size={14} />
                    Atualizar
                </button>
            </div>
        </div>

        {/* Search + Status filter */}
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 text-stone-300" size={15} />
                <input
                    type="text"
                    placeholder="Buscar por ID, cliente ou telefone..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                />
            </div>
            <div className="sm:w-52">
                <select
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-300"
                    value={statusFilter}
                    onChange={e => onStatusFilterChange(e.target.value)}
                >
                    {ORDER_STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
        </div>
    </>
);

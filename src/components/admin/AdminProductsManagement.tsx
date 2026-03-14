import React, { useState, useEffect } from 'react';
import {
    Package,
    Search,
    Plus,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Eye,
    EyeOff,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { getProductsAdmin } from '@/services/productService';
import { supabase } from '@/services/supabase';
import { Product, ProductCategory } from '@/types';
import type { ProductRow } from '@/types/database';
import AdminProductEditor from './AdminProductEditor';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/format';
import { ADMIN_CATEGORY_OPTIONS } from '@/constants/categories';

const PAGE_SIZE = 20;

interface ProductWithFlags extends Product {
    is_new?: boolean;
    is_best_seller?: boolean;
    is_active?: boolean;
}

const categoryOptions = ADMIN_CATEGORY_OPTIONS;

const getStockBadge = (stock: number) => {
    if (stock === 0) return { label: 'Esgotado', cls: 'text-red-600 bg-red-50 border-red-200' };
    if (stock <= 5) return { label: 'Baixo', cls: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'OK', cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
};

const AdminProductsManagement: React.FC = () => {
    const { user, hasRole } = useAuth();
    const isVendedor = hasRole(['vendedor']);

    const [products, setProducts] = useState<ProductWithFlags[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [savedScroll, setSavedScroll] = useState(0);
    const [confirmDeactivate, setConfirmDeactivate] = useState<{ id: string; name: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await getProductsAdmin();
            setProducts((data || []).map((p: ProductRow) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                technicalSpecs: p.technical_specs,
                price: p.price,
                category: p.category as ProductCategory,
                imageUrl: p.image_url,
                gallery: (p.gallery as string[]) || [],
                stock: p.stock,
                rating: p.rating || 0,
                reviewCount: p.review_count || 0,
                is_new: p.is_new,
                is_best_seller: p.is_best_seller,
                is_active: p.is_active !== false,
            })));
        } catch {
            showMessage('error', 'Erro ao carregar produtos.');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const filteredProducts = React.useMemo(() =>
        products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
            return matchesSearch && matchesCategory;
        }),
        [products, searchQuery, categoryFilter]
    );

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pagedProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const handleSearchChange = (value: string) => { setSearchQuery(value); setCurrentPage(1); };
    const handleCategoryFilterChange = (value: string) => { setCategoryFilter(value); setCurrentPage(1); };

    const handleToggleActive = (id: string, currentStatus: boolean, e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        if (currentStatus) {
            setConfirmDeactivate({ id, name });
        } else {
            doToggleActive(id, false);
        }
    };

    const doToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_active: !currentStatus })
                .eq('id', id);
            if (error) throw error;
            setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
            showMessage('success', `Produto ${currentStatus ? 'desativado' : 'ativado'}.`);
        } catch {
            showMessage('error', 'Erro ao alterar status do produto.');
        }
    };

    const handleEditorOpen = (id?: string) => {
        setSavedScroll(window.scrollY);
        if (id) setEditingProductId(id);
        else setIsCreating(true);
    };

    const handleEditorClose = () => {
        setEditingProductId(null);
        setIsCreating(false);
        setTimeout(() => window.scrollTo({ top: savedScroll, behavior: 'instant' }), 0);
    };

    const handleEditorSave = () => {
        handleEditorClose();
        loadProducts();
        showMessage('success', 'Produto salvo com sucesso.');
    };

    if (isCreating || editingProductId) {
        return (
            <AdminProductEditor
                productId={editingProductId || undefined}
                vendedorId={isVendedor ? (user?.id ?? undefined) : undefined}
                onBack={handleEditorClose}
                onSave={handleEditorSave}
            />
        );
    }

    return (
        <>
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-stone-800">Produtos</h1>
                    <p className="text-xs text-stone-500 mt-0.5">
                        {products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {message && (
                        <span className={cn(
                            'flex items-center gap-1.5 text-xs font-medium',
                            message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                        )}>
                            {message.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                            {message.text}
                        </span>
                    )}
                    <button
                        onClick={() => handleEditorOpen()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-700 rounded-lg transition-colors"
                    >
                        <Plus size={14} />
                        Novo produto
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-stone-300" size={15} />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300"
                        value={searchQuery}
                        onChange={e => handleSearchChange(e.target.value)}
                    />
                </div>
                <div className="sm:w-52">
                    <select
                        className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-300"
                        value={categoryFilter}
                        onChange={e => handleCategoryFilterChange(e.target.value)}
                    >
                        {categoryOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                {loading ? (
                    <div className="py-16 flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-stone-100">
                                    <th className="px-4 py-2 text-xs font-medium text-stone-400 min-w-[180px]">Produto</th>
                                    <th className="px-4 py-2 text-xs font-medium text-stone-400 w-px whitespace-nowrap">Categoria</th>
                                    <th className="px-4 py-2 text-xs font-medium text-stone-400 w-px whitespace-nowrap">Preço</th>
                                    <th className="px-4 py-2 text-xs font-medium text-stone-400 w-px whitespace-nowrap">Estoque</th>
                                    <th className="px-4 py-2 text-xs font-medium text-stone-400 w-px whitespace-nowrap">Status</th>
                                    <th className="px-4 py-2 text-xs font-medium text-stone-400 w-px whitespace-nowrap text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-stone-400">
                                            Nenhum produto encontrado.
                                        </td>
                                    </tr>
                                ) : pagedProducts.map(product => {
                                    const stock = getStockBadge(product.stock);
                                    return (
                                        <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-4 py-1.5 min-w-[180px] align-middle">
                                                <div className="flex items-center gap-2">
                                                    {product.imageUrl ? (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt=""
                                                            className={cn(
                                                                'w-11 h-11 rounded object-contain bg-stone-50 border border-stone-100 shrink-0 transition-opacity',
                                                                !product.is_active && 'opacity-40 grayscale'
                                                            )}
                                                        />
                                                    ) : (
                                                        <div className="w-11 h-11 rounded bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                                                            <Package size={18} />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <span className={cn(
                                                            'text-sm font-medium',
                                                            product.is_active ? 'text-stone-800' : 'text-stone-400 line-through'
                                                        )}>
                                                            {product.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-1.5 align-middle w-px whitespace-nowrap">
                                                <span className="text-xs text-stone-500 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-full">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-1.5 align-middle w-px whitespace-nowrap">
                                                <span className="text-sm font-medium text-stone-700">
                                                    {formatCurrency(product.price)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-1.5 align-middle w-px whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-stone-600">{product.stock}</span>
                                                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full border font-medium', stock.cls)}>
                                                        {stock.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-1.5 align-middle w-px whitespace-nowrap">
                                                <button
                                                    onClick={e => handleToggleActive(product.id, !!product.is_active, e, product.name)}
                                                    className={cn(
                                                        'inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded border font-medium transition-colors',
                                                        product.is_active
                                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                                            : 'text-stone-500 bg-stone-50 border-stone-200 hover:bg-stone-100'
                                                    )}
                                                >
                                                    {product.is_active ? <Eye size={10} /> : <EyeOff size={10} />}
                                                    {product.is_active ? 'Ativo' : 'Inativo'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-1.5 text-right align-middle w-px whitespace-nowrap">
                                                <button
                                                    onClick={() => handleEditorOpen(product.id)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors"
                                                >
                                                    <Pencil size={12} />
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && filteredProducts.length > PAGE_SIZE && (
                <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>
                        {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} — página {safePage} de {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                            .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                                if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, idx) =>
                                p === '...'
                                    ? <span key={`e-${idx}`} className="px-1">…</span>
                                    : <button
                                        key={p}
                                        onClick={() => setCurrentPage(p as number)}
                                        className={cn(
                                            'w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                                            safePage === p ? 'bg-stone-900 text-white' : 'hover:bg-stone-100'
                                        )}
                                    >
                                        {p}
                                    </button>
                            )
                        }
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="p-1.5 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            )}
        </div>

        <ConfirmDialog
            open={!!confirmDeactivate}
            title="Desativar produto"
            description={confirmDeactivate ? `Tem certeza que deseja desativar "${confirmDeactivate.name}"? O produto ficará oculto na loja. Você pode reativá-lo a qualquer momento.` : ''}
            confirmLabel="Desativar"
            onCancel={() => setConfirmDeactivate(null)}
            onConfirm={() => {
                if (confirmDeactivate) doToggleActive(confirmDeactivate.id, true);
                setConfirmDeactivate(null);
            }}
        />
        </>
    );
};

export default AdminProductsManagement;

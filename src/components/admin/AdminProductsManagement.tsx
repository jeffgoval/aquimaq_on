import React, { useState, useEffect } from 'react';
import {
    Package,
    Search,
    Plus,
    ChevronDown,
    Pencil,
    Sparkles,
    TrendingUp,
    Eye,
    EyeOff
} from 'lucide-react';
import { getProductsAdmin } from '@/services/productService';
import { supabase } from '@/services/supabase';
import { Product, ProductCategory } from '@/types';
import type { ProductRow } from '@/types/database';
import AdminProductEditor from './AdminProductEditor';

interface ProductWithFlags extends Product {
    is_new?: boolean;
    is_best_seller?: boolean;
    is_active?: boolean;
}

const categoryOptions = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'Ferramentas Manuais', label: 'Ferramentas Manuais' },
    { value: 'Peças de Reposição', label: 'Peças de Reposição' },
    { value: 'Acessórios', label: 'Acessórios' },
    { value: 'Sementes Fracionadas', label: 'Sementes Fracionadas' },
    { value: 'Itens de Prateleira', label: 'Itens de Prateleira' },
];

const AdminProductsManagement: React.FC = () => {
    const [products, setProducts] = useState<ProductWithFlags[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Editor state
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [savedScroll, setSavedScroll] = useState(0);
    const [confirmDeactivate, setConfirmDeactivate] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await getProductsAdmin();

            const mapped = (data || []).map((p: ProductRow) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                technicalSpecs: p.technical_specs,
                price: p.price,
                category: p.category as ProductCategory,
                imageUrl: p.image_url,
                gallery: p.gallery || [],
                stock: p.stock,
                rating: p.rating || 0,
                reviewCount: p.review_count || 0,
                is_new: p.is_new,
                is_best_seller: p.is_best_seller,
                is_active: p.is_active !== false,
            }));

            setProducts(mapped);
        } catch (error) {
            console.error('Error loading products:', error);
            setMessage({ type: 'error', text: 'Erro ao carregar produtos.' });
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = React.useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, categoryFilter]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getStockStatus = (stock: number) => {
        if (stock === 0) return { label: 'Esgotado', color: 'text-red-600 bg-red-50' };
        if (stock <= 5) return { label: 'Baixo', color: 'text-amber-600 bg-amber-50' };
        return { label: 'OK', color: 'text-emerald-600 bg-emerald-50' };
    };

    const handleToggleActive = (id: string, currentStatus: boolean, e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        // Confirmar antes de desativar (oculta produto da loja)
        if (currentStatus) {
            setConfirmDeactivate({ id, name });
        } else {
            doToggleActive(id, false);
        }
    };

    const doToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await (supabase.from('products') as any).update({ is_active: !currentStatus }).eq('id', id);
            if (error) throw error;
            setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
            setMessage({ type: 'success', text: `Produto ${currentStatus ? 'desativado' : 'ativado'}.` });
            setTimeout(() => setMessage(null), 2000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Erro ao alterar status do produto.' });
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
        setMessage({ type: 'success', text: 'Produto salvo com sucesso!' });
        setTimeout(() => setMessage(null), 3000);
    };

    // Show editor if creating or editing
    if (isCreating || editingProductId) {
        return (
            <AdminProductEditor
                productId={editingProductId || undefined}
                onBack={handleEditorClose}
                onSave={handleEditorSave}
            />
        );
    }

    return (
        <>
        <div className="space-y-5 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-stone-800">Produtos</h1>
                    <p className="text-stone-400 text-[13px] mt-0.5">
                        {products.length} produtos cadastrados
                    </p>
                </div>
                <button
                    onClick={() => handleEditorOpen()}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg text-[13px] font-medium hover:bg-stone-700 transition-colors"
                >
                    <Plus size={16} />
                    Novo Produto
                </button>
            </div>

            {/* Feedback */}
            {message && (
                <div className={`px-3 py-2 rounded-lg text-[13px] ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-stone-300" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] placeholder-stone-400 focus:outline-none focus:border-stone-300"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="sm:w-48 relative">
                    <select
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-[13px] text-stone-600 focus:outline-none focus:border-stone-300 appearance-none cursor-pointer"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        {categoryOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 text-stone-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500 mb-2"></div>
                        <p className="text-stone-400 text-[13px]">Carregando...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-stone-100">
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Produto</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Categoria</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Preço</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Estoque</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">Tags</th>
                                    <th className="px-4 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-stone-400 text-[13px]">
                                            Nenhum produto encontrado.
                                        </td>
                                    </tr>
                                ) : filteredProducts.map((product) => {
                                    const stockStatus = getStockStatus(product.stock);

                                    return (
                                        <tr key={product.id} className="hover:bg-stone-25 group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {product.imageUrl ? (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt=""
                                                            className={`w-10 h-10 rounded-lg object-contain bg-white transition-opacity ${!product.is_active ? 'opacity-50 grayscale' : ''}`}
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-stone-400 border border-stone-100">
                                                            <Package size={16} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className={`text-[13px] font-medium block ${!product.is_active ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                                                            {product.name}
                                                        </span>
                                                        <button
                                                            onClick={(e) => handleToggleActive(product.id, !!product.is_active, e, product.name)}
                                                            className={`mt-0.5 text-[10px] flex items-center gap-1 font-medium px-1.5 py-0.5 rounded transition-colors
                                                                ${product.is_active ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-stone-500 bg-stone-100 hover:bg-stone-200'}
                                                            `}
                                                        >
                                                            {product.is_active ? <Eye size={10} /> : <EyeOff size={10} />}
                                                            {product.is_active ? 'Ativo' : 'Inativo'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[12px] text-stone-500 bg-stone-50 px-2 py-0.5 rounded">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[13px] font-medium text-stone-700">
                                                    {formatCurrency(product.price)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13px] text-stone-600">{product.stock}</span>
                                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${stockStatus.color}`}>
                                                        {stockStatus.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    {product.is_new && (
                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-emerald-600 bg-emerald-50">
                                                            <Sparkles size={10} /> Novo
                                                        </span>
                                                    )}
                                                    {product.is_best_seller && (
                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-amber-600 bg-amber-50">
                                                            <TrendingUp size={10} /> Top
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleEditorOpen(product.id)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded-lg text-[12px] font-medium transition-colors"
                                                    aria-label="Editar produto"
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
        </div>

        {/* Modal de confirmação de desativação */}
        {confirmDeactivate && (
            <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl">
                    <h3 className="text-lg font-semibold text-stone-900 mb-2">Desativar Produto</h3>
                    <p className="text-stone-500 mb-1 font-medium text-[14px]">
                        Tem certeza que deseja desativar <span className="text-stone-800 font-semibold">"{confirmDeactivate.name}"</span>?
                    </p>
                    <p className="text-stone-400 text-xs mb-6">
                        O produto ficará oculto na loja. Você pode reativá-lo a qualquer momento.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setConfirmDeactivate(null)}
                            className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => {
                                doToggleActive(confirmDeactivate.id, true);
                                setConfirmDeactivate(null);
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            Desativar
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default AdminProductsManagement;


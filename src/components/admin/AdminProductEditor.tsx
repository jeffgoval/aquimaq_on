import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Save,
    Package,
    Tag,
    DollarSign,
    FileText,
    Search as SearchIcon,
    Sparkles,
    TrendingUp
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { Product, ProductCategory } from '@/types';
import ImageUploader from './ImageUploader';

interface AdminProductEditorProps {
    productId?: string; // undefined = novo produto
    onBack: () => void;
    onSave: () => void;
}

interface ProductFormData {
    name: string;
    description: string;
    technicalSpecs: string;
    price: number;
    oldPrice: number | null;
    discount: number | null;
    category: ProductCategory | string;
    stock: number;
    isNew: boolean;
    isBestSeller: boolean;
    isActive: boolean;
    imageUrl: string;
    gallery: string[];
    slug: string;
    seoTitle: string;
    seoDescription: string;
    wholesaleMinAmount: number | null;
    wholesaleDiscountPercent: number | null;
    culture: string;
}

const categoryOptions = [
    { value: 'Ferramentas Manuais', label: 'Ferramentas Manuais' },
    { value: 'Peças de Reposição', label: 'Peças de Reposição' },
    { value: 'Acessórios', label: 'Acessórios' },
    { value: 'Sementes Fracionadas', label: 'Sementes Fracionadas' },
    { value: 'Itens de Prateleira', label: 'Itens de Prateleira' },
];

const AdminProductEditor: React.FC<AdminProductEditorProps> = ({
    productId,
    onBack,
    onSave
}) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        technicalSpecs: '',
        price: 0,
        oldPrice: null,
        discount: null,
        category: 'Ferramentas Manuais',
        stock: 0,
        isNew: false,
        isBestSeller: false,
        isActive: true,
        imageUrl: '',
        gallery: [],
        slug: '',
        seoTitle: '',
        seoDescription: '',
        wholesaleMinAmount: null,
        wholesaleDiscountPercent: null,
        culture: '',
    });

    // Load product if editing
    useEffect(() => {
        if (productId) {
            loadProduct();
        }
    }, [productId]);

    const loadProduct = async () => {
        if (!productId) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) {
            setMessage({ type: 'error', text: 'Erro ao carregar produto.' });
        } else if (data) {
            setFormData({
                name: data.name || '',
                description: data.description || '',
                technicalSpecs: data.technical_specs || '',
                price: data.price || 0,
                oldPrice: data.old_price || null,
                discount: data.discount || null,
                category: data.category || 'Ferramentas Manuais',
                stock: data.stock || 0,
                isNew: data.is_new || false,
                isBestSeller: data.is_best_seller || false,
                isActive: data.is_active !== false,
                imageUrl: data.image_url || '',
                gallery: data.gallery || [],
                slug: data.slug || '',
                seoTitle: data.seo_title || '',
                seoDescription: data.seo_description || '',
                culture: data.culture || '',
                wholesaleMinAmount: data.wholesale_min_amount || null,
                wholesaleDiscountPercent: data.wholesale_discount_percent || null,
            });
        }
        setLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImagesChange = (images: string[]) => {
        setFormData(prev => ({
            ...prev,
            imageUrl: images[0] || '',
            gallery: images.slice(1),
        }));
    };

    const generateSlug = () => {
        const slug = formData.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        setFormData(prev => ({ ...prev, slug }));
    };

    const calculateDiscount = () => {
        if (formData.oldPrice && formData.oldPrice > formData.price) {
            const discount = Math.round(((formData.oldPrice - formData.price) / formData.oldPrice) * 100);
            setFormData(prev => ({ ...prev, discount }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setMessage({ type: 'error', text: 'Nome é obrigatório.' });
            return;
        }

        setSaving(true);

        const productData = {
            name: formData.name,
            description: formData.description,
            technical_specs: formData.technicalSpecs,
            price: formData.price,
            old_price: formData.oldPrice,
            discount: formData.discount,
            category: formData.category,
            stock: formData.stock,
            is_new: formData.isNew,
            is_best_seller: formData.isBestSeller,
            is_active: formData.isActive,
            image_url: formData.imageUrl,
            gallery: formData.gallery,
            slug: formData.slug || null,
            seo_title: formData.seoTitle || null,
            seo_description: formData.seoDescription || null,
            wholesale_min_amount: formData.wholesaleMinAmount || null,
            wholesale_discount_percent: formData.wholesaleDiscountPercent || null,
            culture: formData.culture || null,
        };

        let error;

        if (productId) {
            // Update
            ({ error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', productId));
        } else {
            // Insert
            ({ error } = await supabase
                .from('products')
                .insert(productData));
        }

        setSaving(false);

        if (error) {
            setMessage({ type: 'error', text: `Erro: ${error.message}` });
        } else {
            setMessage({ type: 'success', text: productId ? 'Produto atualizado!' : 'Produto criado!' });
            setTimeout(() => {
                onSave();
            }, 1000);
        }
    };

    const allImages = [formData.imageUrl, ...formData.gallery].filter(Boolean);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-stone-800">
                        {productId ? 'Editar Produto' : 'Novo Produto'}
                    </h1>
                    <p className="text-stone-400 text-[13px]">
                        {productId ? 'Atualize as informações do produto' : 'Preencha as informações do produto'}
                    </p>
                </div>
            </div>

            {/* Feedback */}
            {message && (
                <div className={`mb-4 px-3 py-2 rounded-lg text-[13px] ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Images */}
                <div className="bg-white rounded-xl border border-stone-100 p-5">
                    <h2 className="text-[14px] font-medium text-stone-700 mb-4 flex items-center gap-2">
                        <Package size={16} className="text-stone-400" />
                        Imagens
                    </h2>
                    <ImageUploader
                        images={allImages}
                        onChange={handleImagesChange}
                        maxImages={6}
                    />
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-stone-100 p-5 space-y-4">
                    <h2 className="text-[14px] font-medium text-stone-700 flex items-center gap-2">
                        <FileText size={16} className="text-stone-400" />
                        Informações Básicas
                    </h2>

                    <div>
                        <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                            Nome do Produto *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                            placeholder="Ex: Enxada Forjada 2,5kg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                            Descrição
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400 resize-none"
                            placeholder="Descrição detalhada do produto..."
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                            Especificações Técnicas
                        </label>
                        <textarea
                            name="technicalSpecs"
                            value={formData.technicalSpecs}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400 resize-none font-mono"
                            placeholder="Peso: 2,5kg | Material: Aço Carbono | ..."
                        />
                    </div>

                    <div>
                        <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                            Categoria
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400 bg-white"
                        >
                            {categoryOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                            Cultura (safra)
                        </label>
                        <input
                            type="text"
                            name="culture"
                            value={formData.culture}
                            onChange={handleChange}
                            placeholder="Ex.: Soja, Milho, Café"
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                        />
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-white rounded-xl border border-stone-100 p-5 space-y-4">
                    <h2 className="text-[14px] font-medium text-stone-700 flex items-center gap-2">
                        <DollarSign size={16} className="text-stone-400" />
                        Preço e Estoque
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                Preço *
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                Preço Antigo
                            </label>
                            <input
                                type="number"
                                name="oldPrice"
                                value={formData.oldPrice || ''}
                                onChange={handleChange}
                                onBlur={calculateDiscount}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                                placeholder="Opcional"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                Desconto %
                            </label>
                            <input
                                type="number"
                                name="discount"
                                value={formData.discount || ''}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                                placeholder="Auto"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                Estoque
                            </label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                            />
                        </div>
                    </div>

                    {/* Wholesale Configuration */}
                    <div className="border-t border-stone-100 pt-4 mt-2">
                        <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={formData.wholesaleMinAmount !== null}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setFormData(prev => ({
                                                ...prev,
                                                wholesaleMinAmount: 1000,
                                                wholesaleDiscountPercent: 5
                                            }));
                                        } else {
                                            setFormData(prev => ({
                                                ...prev,
                                                wholesaleMinAmount: null,
                                                wholesaleDiscountPercent: null
                                            }));
                                        }
                                    }}
                                    className="w-4 h-4 rounded border-stone-300 text-stone-600 focus:ring-stone-500"
                                />
                                <span className="text-[13px] font-medium text-stone-700">Ativar Desconto de Atacado</span>
                            </label>
                        </div>

                        {formData.wholesaleMinAmount !== null && (
                            <div className="bg-stone-50 p-4 rounded-lg grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                <div>
                                    <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                        Meta de Valor (R$)
                                    </label>
                                    <input
                                        type="number"
                                        name="wholesaleMinAmount"
                                        value={formData.wholesaleMinAmount || ''}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                                        placeholder="Ex: 2000.00"
                                    />
                                    <p className="text-[11px] text-stone-400 mt-1">Valor mín. deste produto no carrinho</p>
                                </div>
                                <div>
                                    <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                        Desconto (% OFF)
                                    </label>
                                    <input
                                        type="number"
                                        name="wholesaleDiscountPercent"
                                        value={formData.wholesaleDiscountPercent || ''}
                                        onChange={handleChange}
                                        min="1"
                                        max="100"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                                        placeholder="Ex: 5"
                                    />
                                    <p className="text-[11px] text-stone-400 mt-1">% aplicada ao atingir a meta</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Flags */}
                <div className="bg-white rounded-xl border border-stone-100 p-5 space-y-4">
                    <h2 className="text-[14px] font-medium text-stone-700 flex items-center gap-2">
                        <Tag size={16} className="text-stone-400" />
                        Destaques
                    </h2>

                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-stone-300 text-stone-600 focus:ring-stone-500"
                            />
                            <span className="text-[13px] text-stone-600">Ativo (visível na loja)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isNew"
                                checked={formData.isNew}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-[13px] text-stone-600 flex items-center gap-1">
                                <Sparkles size={14} className="text-emerald-500" />
                                Novidade
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isBestSeller"
                                checked={formData.isBestSeller}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-[13px] text-stone-600 flex items-center gap-1">
                                <TrendingUp size={14} className="text-amber-500" />
                                Mais Vendido
                            </span>
                        </label>
                    </div>
                </div>

                {/* SEO */}
                <div className="bg-white rounded-xl border border-stone-100 p-5 space-y-4">
                    <h2 className="text-[14px] font-medium text-stone-700 flex items-center gap-2">
                        <SearchIcon size={16} className="text-stone-400" />
                        SEO (Opcional)
                    </h2>

                    <div>
                        <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                            Slug da URL
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400 font-mono"
                                placeholder="enxada-forjada-2-5kg"
                            />
                            <button
                                type="button"
                                onClick={generateSlug}
                                className="px-3 py-2 text-stone-500 hover:text-stone-700 hover:bg-stone-50 border border-stone-200 rounded-lg text-[12px] font-medium"
                            >
                                Gerar
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                Título SEO
                            </label>
                            <input
                                type="text"
                                name="seoTitle"
                                value={formData.seoTitle}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                                placeholder="Título para motores de busca"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                                Descrição SEO
                            </label>
                            <input
                                type="text"
                                name="seoDescription"
                                value={formData.seoDescription}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-[13px] focus:outline-none focus:border-stone-400"
                                placeholder="Meta description"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 text-stone-500 hover:text-stone-700 text-[13px] font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-stone-800 text-white rounded-lg text-[13px] font-medium hover:bg-stone-700 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {saving ? 'Salvando...' : (productId ? 'Atualizar' : 'Criar Produto')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminProductEditor;


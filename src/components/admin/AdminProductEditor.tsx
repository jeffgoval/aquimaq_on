import React, { useState, useEffect } from 'react';
import { useCropCalendar } from '@/features/catalog';
import {
    ArrowLeft,
    Save,
    Package,
    Tag,
    DollarSign,
    FileText,
    Search as SearchIcon,
    Sparkles,
    TrendingUp,
    BookOpen,
    Warehouse,
    Loader2,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import ProductDocumentsManager from './ProductDocumentsManager';
import {
    getProductRowById,
    createProduct,
    updateProduct,
} from '@/services/productService';
import { Product, ProductCategory } from '@/types';
import ImageUploader from './ImageUploader';
import { cn } from '@/utils/cn';

interface AdminProductEditorProps {
    productId?: string;
    vendedorId?: string;
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
    expiryDate: string;
    batchNumber: string;
    warehouseLocation: string;
    reorderPoint: number | null;
    supplier: string;
}

const categoryOptions = [
    { value: 'Máquinas e Equipamentos', label: 'Máquinas e Equipamentos' },
    { value: 'Peças de Reposição', label: 'Peças de Reposição' },
    { value: 'Insumos Agrícolas', label: 'Insumos Agrícolas' },
    { value: 'Colheita e Ferramentas', label: 'Colheita e Ferramentas' },
    { value: 'Linha Pet', label: 'Linha Pet' },
    { value: 'EPI e Segurança', label: 'EPI e Segurança' },
    { value: 'Ferramentas Manuais', label: 'Ferramentas Manuais' },
    { value: 'Acessórios', label: 'Acessórios' },
    { value: 'Sementes Fracionadas', label: 'Sementes Fracionadas' },
];

const inputCls = 'w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white';
const labelCls = 'block text-xs font-medium text-stone-600 mb-1.5';

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
            <span className="text-stone-400">{icon}</span>
            <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
        </div>
        <div className="p-5 space-y-4">{children}</div>
    </div>
);

const AdminProductEditor: React.FC<AdminProductEditorProps> = ({ productId, vendedorId, onBack, onSave }) => {
    const { cultures: availableCultures } = useCropCalendar();
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
        category: 'Máquinas e Equipamentos',
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
        expiryDate: '',
        batchNumber: '',
        warehouseLocation: '',
        reorderPoint: null,
        supplier: '',
    });

    useEffect(() => { if (productId) loadProduct(); }, [productId]);

    const loadProduct = async () => {
        if (!productId) return;
        setLoading(true);
        const data = await getProductRowById(productId);
        if (data) {
            setFormData({
                name: data.name || '',
                description: data.description || '',
                technicalSpecs: data.technical_specs || '',
                price: data.price || 0,
                oldPrice: data.old_price || null,
                discount: data.discount || null,
                category: data.category || 'Máquinas e Equipamentos',
                stock: data.stock || 0,
                isNew: data.is_new || false,
                isBestSeller: data.is_best_seller || false,
                isActive: data.is_active !== false,
                imageUrl: data.image_url || '',
                gallery: (data.gallery as string[]) || [],
                slug: data.slug || '',
                seoTitle: data.seo_title || '',
                seoDescription: data.seo_description || '',
                culture: data.culture || '',
                wholesaleMinAmount: data.wholesale_min_amount || null,
                wholesaleDiscountPercent: data.wholesale_discount_percent || null,
                expiryDate: data.expiry_date || '',
                batchNumber: data.batch_number || '',
                warehouseLocation: data.warehouse_location || '',
                reorderPoint: data.reorder_point ?? null,
                supplier: data.supplier || '',
            });
        } else {
            setMessage({ type: 'error', text: 'Erro ao carregar produto.' });
        }
        setLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImagesChange = (images: string[]) => {
        setFormData(prev => ({ ...prev, imageUrl: images[0] || '', gallery: images.slice(1) }));
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
            expiry_date: formData.expiryDate || null,
            batch_number: formData.batchNumber || null,
            warehouse_location: formData.warehouseLocation || null,
            reorder_point: formData.reorderPoint ?? null,
            supplier: formData.supplier || null,
            ...(vendedorId && !productId ? { vendedor_id: vendedorId } : {}),
        };

        try {
            if (productId) {
                await updateProduct(productId, productData);
            } else {
                await createProduct(productData);
            }
            setMessage({ type: 'success', text: productId ? 'Produto atualizado.' : 'Produto criado.' });
            setTimeout(() => onSave(), 1000);
        } catch (err) {
            setMessage({ type: 'error', text: `Erro: ${err instanceof Error ? err.message : 'Falha ao salvar.'}` });
        } finally {
            setSaving(false);
        }
    };

    const allImages = [formData.imageUrl, ...formData.gallery].filter(Boolean);

    if (loading) {
        return (
            <div className="py-16 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-200 border-t-stone-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold text-stone-800">
                        {productId ? 'Editar produto' : 'Novo produto'}
                    </h1>
                    <p className="text-xs text-stone-500 mt-0.5">
                        {productId ? 'Atualize as informações do produto' : 'Preencha as informações do produto'}
                    </p>
                </div>
                {message && (
                    <span className={cn(
                        'flex items-center gap-1.5 text-xs font-medium',
                        message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                    )}>
                        {message.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                        {message.text}
                    </span>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Images */}
                <SectionCard title="Imagens" icon={<Package size={15} />}>
                    <ImageUploader
                        images={allImages}
                        onChange={handleImagesChange}
                        maxImages={6}
                    />
                </SectionCard>

                {/* Basic Info */}
                <SectionCard title="Informações básicas" icon={<FileText size={15} />}>
                    <div>
                        <label className={labelCls}>Nome do produto <span className="text-red-400">*</span></label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={inputCls}
                            placeholder="Ex: Enxada Forjada 2,5kg"
                            required
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Descrição</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className={cn(inputCls, 'resize-none')}
                            placeholder="Descrição detalhada do produto..."
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Especificações técnicas</label>
                        <textarea
                            name="technicalSpecs"
                            value={formData.technicalSpecs}
                            onChange={handleChange}
                            rows={3}
                            className={cn(inputCls, 'resize-none font-mono')}
                            placeholder="Peso: 2,5kg | Material: Aço Carbono | ..."
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Categoria</label>
                            <select name="category" value={formData.category} onChange={handleChange} className={inputCls}>
                                {categoryOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Cultura (safra)</label>
                            <select name="culture" value={formData.culture} onChange={handleChange} className={inputCls}>
                                <option value="">— Nenhuma —</option>
                                {availableCultures.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </SectionCard>

                {/* Warehouse */}
                <SectionCard title="Controle de estoque agrícola" icon={<Warehouse size={15} />}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Fornecedor</label>
                            <input
                                type="text"
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleChange}
                                placeholder="Ex.: Bayer, Basf, Syngenta"
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Localização no depósito</label>
                            <input
                                type="text"
                                name="warehouseLocation"
                                value={formData.warehouseLocation}
                                onChange={handleChange}
                                placeholder="Ex.: A3-P2, Corredor B"
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Número do lote</label>
                            <input
                                type="text"
                                name="batchNumber"
                                value={formData.batchNumber}
                                onChange={handleChange}
                                placeholder="Ex.: LOT-2024-001"
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Data de validade</label>
                            <input
                                type="date"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Ponto de recompra (unidades)</label>
                            <input
                                type="number"
                                name="reorderPoint"
                                value={formData.reorderPoint ?? ''}
                                onChange={e => setFormData(prev => ({
                                    ...prev,
                                    reorderPoint: e.target.value ? parseInt(e.target.value) : null,
                                }))}
                                min="0"
                                placeholder="Ex.: 10"
                                className={inputCls}
                            />
                            <p className="text-xs text-stone-400 mt-1">Alerta quando estoque atingir este valor</p>
                        </div>
                    </div>
                </SectionCard>

                {/* Pricing */}
                <SectionCard title="Preço e estoque" icon={<DollarSign size={15} />}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <label className={labelCls}>Preço <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                inputMode="decimal"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Preço antigo</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                name="oldPrice"
                                value={formData.oldPrice || ''}
                                onChange={handleChange}
                                onBlur={calculateDiscount}
                                className={inputCls}
                                placeholder="Opcional"
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Desconto %</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                name="discount"
                                value={formData.discount || ''}
                                onChange={handleChange}
                                className={inputCls}
                                placeholder="Auto"
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Estoque</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {/* Wholesale */}
                    <div className="border-t border-stone-100 pt-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={formData.wholesaleMinAmount !== null}
                                onChange={e => {
                                    if (e.target.checked) {
                                        setFormData(prev => ({ ...prev, wholesaleMinAmount: 1000, wholesaleDiscountPercent: 5 }));
                                    } else {
                                        setFormData(prev => ({ ...prev, wholesaleMinAmount: null, wholesaleDiscountPercent: null }));
                                    }
                                }}
                                className="w-4 h-4 rounded border-stone-300 text-stone-600 focus:ring-stone-500"
                            />
                            <span className="text-sm font-medium text-stone-700">Ativar desconto de atacado</span>
                        </label>

                        {formData.wholesaleMinAmount !== null && (
                            <div className="mt-3 bg-stone-50 p-4 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Meta de valor (R$)</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        name="wholesaleMinAmount"
                                        value={formData.wholesaleMinAmount || ''}
                                        onChange={handleChange}
                                        className={inputCls}
                                        placeholder="Ex: 2000.00"
                                    />
                                    <p className="text-xs text-stone-400 mt-1">Valor mín. deste produto no carrinho</p>
                                </div>
                                <div>
                                    <label className={labelCls}>Desconto (% OFF)</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        name="wholesaleDiscountPercent"
                                        value={formData.wholesaleDiscountPercent || ''}
                                        onChange={handleChange}
                                        className={inputCls}
                                        placeholder="Ex: 5"
                                    />
                                    <p className="text-xs text-stone-400 mt-1">% aplicada ao atingir a meta</p>
                                </div>
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* Flags */}
                <SectionCard title="Destaques" icon={<Tag size={15} />}>
                    <div className="flex flex-wrap gap-5">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-stone-300 text-stone-600 focus:ring-stone-500"
                            />
                            <span className="text-sm text-stone-600">Ativo (visível na loja)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isNew"
                                checked={formData.isNew}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-stone-600 flex items-center gap-1">
                                <Sparkles size={13} className="text-emerald-500" /> Novidade
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
                            <span className="text-sm text-stone-600 flex items-center gap-1">
                                <TrendingUp size={13} className="text-amber-500" /> Mais vendido
                            </span>
                        </label>
                    </div>
                </SectionCard>

                {/* SEO */}
                <SectionCard title="SEO (opcional)" icon={<SearchIcon size={15} />}>
                    <div>
                        <label className={labelCls}>Slug da URL</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className={cn(inputCls, 'font-mono flex-1')}
                                placeholder="enxada-forjada-2-5kg"
                            />
                            <button
                                type="button"
                                onClick={generateSlug}
                                className="px-3 py-2 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors"
                            >
                                Gerar
                            </button>
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Título SEO</label>
                            <input
                                type="text"
                                name="seoTitle"
                                value={formData.seoTitle}
                                onChange={handleChange}
                                className={inputCls}
                                placeholder="Título para motores de busca"
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Descrição SEO</label>
                            <input
                                type="text"
                                name="seoDescription"
                                value={formData.seoDescription}
                                onChange={handleChange}
                                className={inputCls}
                                placeholder="Meta description"
                            />
                        </div>
                    </div>
                </SectionCard>

                {/* Documents */}
                {productId && (
                    <SectionCard title="Bulas e manuais" icon={<BookOpen size={15} />}>
                        <p className="text-xs text-stone-400 -mt-2 mb-2">
                            Documentos indexados na IA de atendimento (RAG).
                        </p>
                        <ProductDocumentsManager productId={productId} />
                    </SectionCard>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 pb-6">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-700 rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? 'Salvando...' : (productId ? 'Atualizar' : 'Criar produto')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminProductEditor;

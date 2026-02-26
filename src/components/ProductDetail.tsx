import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronRight, ShoppingCart, MessageCircle, FileText, ExternalLink,
    ShieldCheck, Truck, CreditCard, RefreshCcw, MapPin, Loader2,
    AlertTriangle, Store, Zap, Tag, Users, CheckCircle,
} from 'lucide-react';
import { Product } from '@/types';
import type { CartItemForShipping } from '@/services/shippingService';
import type { ShippingOption } from '@/types';
import ProductGallery from './ProductGallery';
import StarRating from './StarRating';
import QuantitySelector from './ui/QuantitySelector';
import SectionErrorBoundary from './SectionErrorBoundary';
import ProductReviews from './ProductReviews';
import RelatedProducts from './RelatedProducts';
import RecommendationsByCulture from './RecommendationsByCulture';
import { useCropCalendar } from '@/hooks/useCropCalendar';
import { useStore } from '@/contexts/StoreContext';
import { useProductDocuments } from '@/hooks/useProductDocuments';
import ProductSEO from './product/ProductSEO';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/utils/format';
import { calculateShipping } from '@/services/shippingService';
import { validateCEP } from '@/utils/validators';
import { maskCEP } from '@/utils/masks';

const PIX_DISCOUNT = 0.05;
const LOW_STOCK_THRESHOLD = 5;

type Tab = 'descricao' | 'especificacoes' | 'documentos';

interface ProductDetailProps {
    product: Product;
    onAddToCart: (product: Product, quantity?: number) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onAddToCart }) => {
    const navigate = useNavigate();
    const { settings } = useStore();
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<Tab>('descricao');
    const [showStickyFooter, setShowStickyFooter] = useState(false);

    // Inline shipping estimator state
    const [cep, setCep] = useState('');
    const [shippingLoading, setShippingLoading] = useState(false);
    const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
    const [shippingError, setShippingError] = useState<string | null>(null);
    const [shippingCalculated, setShippingCalculated] = useState(false);

    const ctaRef = useRef<HTMLDivElement>(null);
    const { documents: productDocs, loading: docsLoading } = useProductDocuments(product.id);
    const { cultures: availableCultures } = useCropCalendar();

    const whatsappNumber = settings?.phone?.replace(/\D/g, '') ?? import.meta.env.VITE_WHATSAPP_NUMBER ?? '';

    // Reset on product change
    useEffect(() => {
        setQuantity(1);
        setActiveTab('descricao');
        setShippingCalculated(false);
        setShippingOptions([]);
        setShippingError(null);
        setCep('');
    }, [product.id]);

    // Sticky mobile footer via IntersectionObserver
    useEffect(() => {
        const el = ctaRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => setShowStickyFooter(!entry.isIntersecting),
            { threshold: 0 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const galleryImages = (
        product.gallery ? [product.imageUrl, ...product.gallery] : [product.imageUrl]
    ).filter(Boolean) as string[];

    const isOutOfStock = product.stock === 0;
    const isLowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
    const pixPrice = product.price * (1 - PIX_DISCOUNT);
    const installmentValue = product.price / 10;
    const hasWholesale = product.wholesaleMinAmount != null && product.wholesaleDiscountPercent != null;

    const handleCalculateShipping = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const rawCep = cep.replace(/\D/g, '');
        if (!validateCEP(cep)) {
            setShippingError('CEP inválido. Digite 8 dígitos.');
            return;
        }
        setShippingLoading(true);
        setShippingError(null);
        try {
            const shippingItems: CartItemForShipping[] = [{
                id: product.id,
                name: product.name,
                quantity,
                price: product.price,
                weight: product.weight,
                width: product.width,
                height: product.height,
                length: product.length,
            }];
            const { options, error } = await calculateShipping(rawCep, shippingItems);
            setShippingOptions(options);
            setShippingCalculated(true);
            if (error) setShippingError(error);
        } catch {
            setShippingError('Não foi possível calcular o frete.');
        } finally {
            setShippingLoading(false);
        }
    }, [cep, product, quantity]);

    const tabs: { id: Tab; label: string }[] = [
        { id: 'descricao', label: 'Descrição' },
        ...(product.technicalSpecs ? [{ id: 'especificacoes' as Tab, label: 'Especificações' }] : []),
        ...(!docsLoading && productDocs.length > 0 ? [{ id: 'documentos' as Tab, label: 'Documentos' }] : []),
    ];

    const trustSeals = [
        { icon: ShieldCheck, label: 'Compra Segura' },
        { icon: Truck, label: 'Entrega Brasil' },
        { icon: CreditCard, label: '10x Sem Juros' },
        { icon: RefreshCcw, label: 'Troca Fácil' },
    ] as const;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
            <ProductSEO product={product} />

            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 flex-wrap">
                <Link to={ROUTES.HOME} className="hover:text-agro-600 transition-colors shrink-0">Início</Link>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
                <Link to={ROUTES.HOME} className="hover:text-agro-600 transition-colors truncate max-w-[160px]">
                    {product.category}
                </Link>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
                <span className="text-gray-800 font-medium truncate max-w-[240px]">{product.name}</span>
            </nav>

            {/* ─── Main product grid ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">

                {/* ── LEFT: Gallery (sticky on desktop) ── */}
                <div className="lg:sticky lg:top-24 lg:self-start">
                    <ProductGallery images={galleryImages} productName={product.name} />

                    {/* Trust seals — desktop only, below gallery */}
                    <div className="hidden lg:grid grid-cols-4 gap-3 mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        {trustSeals.map(({ icon: Icon, label }) => (
                            <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                    <Icon size={16} className="text-agro-600" />
                                </div>
                                <span className="text-[11px] font-medium text-gray-600 leading-tight">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── RIGHT: Product info ── */}
                <div className="flex flex-col gap-5">

                    {/* Badges */}
                    {(product.isNew || product.isBestSeller || product.discount) && (
                        <div className="flex flex-wrap gap-2">
                            {product.isNew && (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                    <Zap size={11} /> Novo
                                </span>
                            )}
                            {product.isBestSeller && (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                    <Tag size={11} /> Mais Vendido
                                </span>
                            )}
                            {product.discount && (
                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                                    -{product.discount}% OFF
                                </span>
                            )}
                        </div>
                    )}

                    {/* Category + Brand */}
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-agro-600 uppercase tracking-widest">
                            {product.category}
                        </span>
                        {product.brand && (
                            <span className="text-sm text-gray-500">
                                Marca: <span className="font-semibold text-gray-700">{product.brand}</span>
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 leading-tight">
                        {product.name}
                    </h1>

                    {/* Rating */}
                    {product.reviewCount > 0 && (
                        <div className="flex items-center gap-2">
                            <StarRating rating={product.rating} count={product.reviewCount} size={16} />
                            <span className="text-xs text-gray-300">|</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Users size={12} /> {product.reviewCount} avaliações
                            </span>
                        </div>
                    )}

                    {/* ── Price block ── */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                        {product.oldPrice && (
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-gray-400 text-sm line-through">
                                    {formatCurrency(product.oldPrice)}
                                </span>
                                {product.discount && (
                                    <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                        -{product.discount}%
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-4xl font-extrabold text-gray-900">
                                {formatCurrency(product.price)}
                            </span>
                        </div>

                        {/* PIX price */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-sm font-bold px-3 py-1.5 rounded-lg">
                                <Zap size={14} />
                                {formatCurrency(pixPrice)} no Pix
                                <span className="bg-green-200 text-green-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                                    5% OFF
                                </span>
                            </span>
                        </div>

                        {/* Installments */}
                        <p className="text-sm text-gray-500">
                            ou{' '}
                            <span className="font-semibold text-gray-700">
                                10x de {formatCurrency(installmentValue)}
                            </span>{' '}
                            sem juros
                        </p>
                    </div>

                    {/* Stock status */}
                    {isOutOfStock ? (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                            <AlertTriangle size={16} />
                            <span className="text-sm font-semibold">Produto indisponível no momento</span>
                        </div>
                    ) : isLowStock ? (
                        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                            <AlertTriangle size={16} />
                            <span className="text-sm font-semibold">
                                Restam apenas <strong>{product.stock}</strong> unidades em estoque!
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle size={15} />
                            <span className="text-sm font-medium">Em estoque ({product.stock} disponíveis)</span>
                        </div>
                    )}

                    {/* Wholesale info */}
                    {hasWholesale && (
                        <div className="flex items-start gap-3 bg-agro-50 border border-agro-100 rounded-xl p-4">
                            <Users size={18} className="text-agro-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-agro-800">Desconto Atacado</p>
                                <p className="text-sm text-agro-700">
                                    Compras a partir de {formatCurrency(product.wholesaleMinAmount!)} ganham{' '}
                                    <strong>{product.wholesaleDiscountPercent}% de desconto</strong> por item.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Quantity + CTAs ── */}
                    <div ref={ctaRef} className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-700">Quantidade</span>
                            <QuantitySelector
                                value={quantity}
                                min={1}
                                max={Math.max(1, product.stock ?? 1)}
                                onChange={setQuantity}
                                showMaxMessage
                                disabled={isOutOfStock}
                            />
                        </div>

                        {/* Primary CTA: Comprar Agora */}
                        <button
                            onClick={() => { onAddToCart(product, quantity); navigate(ROUTES.CART); }}
                            disabled={isOutOfStock}
                            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white py-4 rounded-xl font-bold text-base transition-all shadow-lg shadow-orange-200/60 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                            {isOutOfStock ? 'Indisponível' : 'Comprar Agora'}
                        </button>

                        {/* Secondary CTA: Adicionar ao Carrinho */}
                        <button
                            onClick={() => onAddToCart(product, quantity)}
                            disabled={isOutOfStock}
                            className="w-full bg-white border-2 border-agro-600 text-agro-700 hover:bg-agro-50 active:bg-agro-100 py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            <ShoppingCart size={18} />
                            {isOutOfStock ? 'Indisponível' : 'Adicionar ao Carrinho'}
                        </button>

                        {/* Tertiary CTA: WhatsApp */}
                        {whatsappNumber && (
                            <a
                                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                                    `Olá! Tenho interesse no produto:\n\n📦 *${product.name}*\nPreço: ${formatCurrency(product.price)}\n\nPodemos negociar?`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-[#25D366] hover:bg-[#20c45e] text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={17} />
                                Negociar no WhatsApp
                            </a>
                        )}
                    </div>

                    {/* ── Inline Shipping Estimator ── */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                            <Truck size={16} className="text-agro-600" />
                            <span className="text-sm font-semibold text-gray-800">Calcular Frete e Prazo</span>
                        </div>
                        <div className="p-4">
                            <form onSubmit={handleCalculateShipping} className="flex gap-2 mb-3">
                                <div className="relative flex-1">
                                    <MapPin size={14} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={cep}
                                        onChange={e => { setCep(maskCEP(e.target.value)); setShippingError(null); }}
                                        placeholder="00000-000"
                                        maxLength={9}
                                        className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-agro-500/20 focus:border-agro-500 outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={shippingLoading || !validateCEP(cep)}
                                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 shrink-0"
                                >
                                    {shippingLoading ? <Loader2 size={15} className="animate-spin" /> : 'Calcular'}
                                </button>
                            </form>

                            {shippingError && (
                                <p className="text-amber-700 text-xs mb-3">{shippingError}</p>
                            )}

                            {shippingCalculated && (
                                <div className="space-y-2">
                                    {shippingOptions.map(option => (
                                        <div
                                            key={option.id}
                                            className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2.5"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                {option.carrier === 'Loja Física'
                                                    ? <Store size={14} className="text-gray-400 shrink-0" />
                                                    : <Truck size={14} className="text-gray-400 shrink-0" />
                                                }
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {option.carrier} — {option.service}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {option.estimatedDays === 0
                                                            ? 'Disponível imediatamente'
                                                            : `Até ${option.estimatedDays} dias úteis`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold shrink-0 ml-2">
                                                {option.price === 0
                                                    ? <span className="text-emerald-600">Grátis</span>
                                                    : <span className="text-gray-900">{formatCurrency(option.price)}</span>
                                                }
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Trust seals — mobile only */}
                    <div className="lg:hidden grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        {trustSeals.map(({ icon: Icon, label }) => (
                            <div key={label} className="flex flex-col items-center gap-1 text-center">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                    <Icon size={14} className="text-agro-600" />
                                </div>
                                <span className="text-[10px] font-medium text-gray-500 leading-tight">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* ── Tabs: Descrição / Especificações / Documentos ── */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex border-b border-gray-200 bg-gray-50">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === tab.id
                                        ? 'text-agro-700 bg-white border-b-2 border-agro-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-5">
                            {activeTab === 'descricao' && (
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                    {product.description}
                                </p>
                            )}
                            {activeTab === 'especificacoes' && (
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                    {product.technicalSpecs}
                                </p>
                            )}
                            {activeTab === 'documentos' && (
                                <ul className="space-y-3">
                                    {productDocs.map(doc => (
                                        <li key={doc.id}>
                                            <a
                                                href={doc.file_url!}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2.5 text-sm font-medium text-agro-700 hover:text-agro-800 group"
                                            >
                                                <span className="w-8 h-8 bg-agro-50 rounded-lg flex items-center justify-center group-hover:bg-agro-100 transition-colors shrink-0">
                                                    <FileText size={15} className="text-agro-600" />
                                                </span>
                                                {doc.doc_type === 'bula' ? 'Bula' : 'Ficha técnica'}: {doc.title}
                                                <ExternalLink size={13} className="text-agro-400 shrink-0" />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Below-fold sections ─── */}
            <div className="mt-16 space-y-0">
                <SectionErrorBoundary>
                    <ProductReviews product={product} />
                </SectionErrorBoundary>
                <SectionErrorBoundary>
                    <RelatedProducts currentProduct={product} onAddToCart={onAddToCart} />
                </SectionErrorBoundary>
                {product.culture && (
                    <SectionErrorBoundary>
                        <RecommendationsByCulture
                            culture={product.culture}
                            availableCultures={availableCultures}
                            excludeProductId={product.id}
                            onAddToCart={onAddToCart}
                            limit={4}
                        />
                    </SectionErrorBoundary>
                )}
            </div>

            {/* ─── Sticky mobile footer (appears when CTAs scroll out of view) ─── */}
            {showStickyFooter && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        {product.oldPrice && (
                            <span className="text-xs text-gray-400 line-through block leading-none">
                                {formatCurrency(product.oldPrice)}
                            </span>
                        )}
                        <span className="text-lg font-extrabold text-gray-900 leading-tight block">
                            {formatCurrency(product.price)}
                        </span>
                    </div>
                    <button
                        onClick={() => onAddToCart(product, quantity)}
                        disabled={isOutOfStock}
                        aria-label="Adicionar ao carrinho"
                        className="w-11 h-11 rounded-xl bg-white border-2 border-agro-600 text-agro-700 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ShoppingCart size={17} />
                    </button>
                    <button
                        onClick={() => { onAddToCart(product, quantity); navigate(ROUTES.CART); }}
                        disabled={isOutOfStock}
                        className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0 min-w-[110px]"
                    >
                        Comprar Agora
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;

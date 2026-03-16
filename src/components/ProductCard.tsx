import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { ROUTES } from '@/constants/routes';
import { ShoppingCart, Heart, Zap, Truck, MessageCircle } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useStore } from '@/contexts/StoreContext';
import StarRating from './StarRating';
import Image from './Image';
import { formatCurrency } from '@/utils/format';
import type { SeasonalStatus } from '@/utils/cropCalendar';
import { SEASONAL_STATUS_LABEL } from '@/utils/cropCalendar';
import type { ShippingRule } from '@/types/store';

const getShippingRestriction = (
  rules: ShippingRule[] | undefined,
  category: string
): ShippingRule | null => {
  if (!rules?.length) return null;
  return rules.find((r) => r.category === category) ?? null;
};

const LOW_STOCK_THRESHOLD = 5;

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product, quantity?: number) => void;
    onViewDetails?: (product: Product) => void;
    imageLoading?: 'eager' | 'lazy';
    seasonalStatus?: SeasonalStatus | null;
}

const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onAddToCart,
    imageLoading = 'lazy',
    seasonalStatus = null,
}) => {
    const { settings } = useStore();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const isFavorite = isInWishlist(product.id);
    const shippingRule = getShippingRestriction(settings?.shippingRules, product.category);

    const isOutOfStock = product.stock === 0;
    const isLowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
    const pixPrice = product.price * (1 - (settings?.pixDiscount ?? 0.05));

    const [showSavedFeedback, setShowSavedFeedback] = React.useState(false);

    const handleWishlistClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const wasAdded = !isFavorite;
        toggleWishlist(product.id);

        if (wasAdded) {
            setShowSavedFeedback(true);
            setTimeout(() => setShowSavedFeedback(false), 2000);
        }
    };

    return (
        <article
            className="bg-white rounded-xl border border-gray-200 hover:border-agro-300 overflow-hidden flex flex-col h-full hover:-translate-y-1 hover:shadow-xl hover:shadow-agro-900/8 transition-all duration-200 group relative"
            aria-label={`Produto: ${product.name}`}
        >
            {/* ── Image area ── */}
            <Link
                to={ROUTES.PRODUCT(product.id)}
                className="relative h-52 w-full bg-gray-50 overflow-hidden block shrink-0"
                aria-label={`Ver detalhes de ${product.name}`}
                tabIndex={-1}
            >
                {/* Out-of-stock overlay */}
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/75 z-10 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                            Indisponível
                        </span>
                    </div>
                )}

                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    loading={imageLoading}
                    className="w-full h-full object-contain group-hover:scale-[1.07] transition-transform duration-500"
                />

                {/* Top-left: promo badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                    {product.discount && (
                        <span className="bg-earth-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            -{product.discount}% OFF
                        </span>
                    )}
                    {product.isNew && (
                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            NOVO
                        </span>
                    )}
                    {product.isBestSeller && (
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            + VENDIDO
                        </span>
                    )}
                    {seasonalStatus && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                            seasonalStatus === 'em_safra' ? 'bg-emerald-600 text-white' :
                            seasonalStatus === 'pre_safra' ? 'bg-sky-500 text-white' :
                            'bg-amber-600 text-white'
                        }`}>
                            🌱 {SEASONAL_STATUS_LABEL[seasonalStatus]}
                        </span>
                    )}
                    {shippingRule && (
                        <span className="inline-flex items-center gap-0.5 bg-slate-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            <Truck size={10} />
                            {shippingRule.shipping_method === 'local_pickup_only' ? 'Apenas Retirada' : 'Entrega Regional'}
                        </span>
                    )}
                </div>

                {/* Bottom-left: low stock */}
                {isLowStock && (
                    <span className="absolute bottom-2 left-2 z-10 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                        Restam {product.stock}
                    </span>
                )}
            </Link>

            {/* ♥ Wishlist */}
            <div className="absolute top-2 right-2 z-20 flex flex-col items-end">
                <button
                    className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full hover:bg-white transition-colors shadow-sm relative group"
                    onClick={handleWishlistClick}
                    aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                    <Heart
                        size={16}
                        className={`${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-400'} transition-all duration-300 ${showSavedFeedback ? 'scale-125' : 'scale-100'}`}
                    />
                </button>
                <div
                    className={`mt-1 px-2 py-0.5 bg-black/75 text-white text-[10px] font-bold rounded-md transition-all duration-300 pointer-events-none origin-top ${
                        showSavedFeedback ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'
                    }`}
                >
                    Salvo
                </div>
            </div>

            {/* ── Info area ── */}
            <div className="px-4 pt-3 pb-0 flex flex-col flex-1">
                {/* Category + brand */}
                <p className="text-[10px] font-bold text-agro-700 uppercase tracking-widest truncate mb-1">
                    {product.category}
                    {product.brand && (
                        <span className="text-gray-400 font-normal normal-case tracking-normal ml-1.5">
                            · {product.brand}
                        </span>
                    )}
                </p>

                {/* Name */}
                <Link to={ROUTES.PRODUCT(product.id)} className="block hover:text-agro-700 transition-colors mb-2">
                    <h3 className="text-gray-900 font-semibold text-sm leading-snug line-clamp-2">
                        {product.name}
                    </h3>
                </Link>

                {/* Star rating */}
                {product.reviewCount > 0 && (
                    <div className="mb-3">
                        <StarRating rating={product.rating} count={product.reviewCount} size={11} />
                    </div>
                )}

                {/* Price block */}
                <div className="mt-auto pt-3 border-t border-gray-100">
                    {product.oldPrice && (
                        <span className="text-xs text-gray-400 line-through block leading-none mb-0.5">
                            {formatCurrency(product.oldPrice)}
                        </span>
                    )}
                    <span className="text-xl font-extrabold text-gray-900 block leading-tight">
                        {formatCurrency(product.price)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-0.5">
                        <Zap size={10} />
                        {formatCurrency(pixPrice)} no Pix
                    </span>
                </div>
            </div>

            {/* ── Add to cart ── */}
            <div className="px-4 py-3 space-y-2">
                <button
                    onClick={() => onAddToCart(product)}
                    disabled={isOutOfStock}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-agro-600 hover:bg-agro-700 active:bg-agro-800 active:scale-[0.98] text-white text-sm font-semibold rounded-lg transition-all duration-150 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    aria-label={isOutOfStock ? 'Produto indisponível' : `Adicionar ${product.name} ao carrinho`}
                >
                    <ShoppingCart size={15} />
                    {isOutOfStock ? 'Indisponível' : 'Adicionar ao Carrinho'}
                </button>
                {shippingRule && settings?.phone && (
                    <a
                        href={`https://wa.me/55${settings.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, gostaria de saber sobre a logística do produto: ${product.name}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium rounded-lg transition-colors"
                    >
                        <MessageCircle size={14} />
                        Consultar Logística via WhatsApp
                    </a>
                )}
            </div>
        </article>
    );
};

export default ProductCard;

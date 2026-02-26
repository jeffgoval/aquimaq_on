import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { ROUTES } from '@/constants/routes';
import { ShoppingCart, Heart, Zap } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import StarRating from './StarRating';
import Image from './Image';
import { formatCurrency } from '@/utils/format';

const PIX_DISCOUNT = 0.05;
const LOW_STOCK_THRESHOLD = 5;

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product, quantity?: number) => void;
    onViewDetails?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
    const { isInWishlist, toggleWishlist } = useWishlist();
    const isFavorite = isInWishlist(product.id);

    const isOutOfStock = product.stock === 0;
    const isLowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
    const pixPrice = product.price * (1 - PIX_DISCOUNT);

    return (
        <article
            className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group relative"
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
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />

                {/* Top-left: promo badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                    {product.discount && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
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
                </div>

                {/* Bottom-left: low stock (não colide com ♥) */}
                {isLowStock && (
                    <span className="absolute bottom-2 left-2 z-10 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                        Restam {product.stock}
                    </span>
                )}
            </Link>

            {/* ♥ Wishlist — fora do Link, sem colisão com badges */}
            <button
                className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-sm p-1.5 rounded-full hover:bg-white transition-colors shadow-sm"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist(product.id);
                }}
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
                <Heart
                    size={16}
                    className={`${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'} transition-colors`}
                />
            </button>

            {/* ── Info area ── */}
            <div className="px-4 pt-3 pb-0 flex flex-col flex-1">
                {/* Category + brand */}
                <p className="text-[10px] font-bold text-agro-600 uppercase tracking-widest truncate mb-1">
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

                {/* Price block — sticky to bottom of info area */}
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

            {/* ── Add to cart — full-width ── */}
            <div className="px-4 py-3">
                <button
                    onClick={() => onAddToCart(product)}
                    disabled={isOutOfStock}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-agro-600 hover:bg-agro-700 active:bg-agro-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    aria-label={isOutOfStock ? 'Produto indisponível' : `Adicionar ${product.name} ao carrinho`}
                >
                    <ShoppingCart size={15} />
                    {isOutOfStock ? 'Indisponível' : 'Adicionar ao Carrinho'}
                </button>
            </div>
        </article>
    );
};

export default ProductCard;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { ROUTES } from '@/constants/routes';
import { ShoppingCart, Heart, ImageOff } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import StarRating from './StarRating';
import Image from './Image';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity?: number) => void;
  // onViewDetails prop is now optional or deprecated as we use Link
  onViewDetails?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = isInWishlist(product.id);

  return (
    <article
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow group relative"
      aria-label={`Produto: ${product.name}`}
    >
      <button
        className="absolute top-2 right-2 z-20 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors shadow-sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Heart
          size={20}
          className={`${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'} transition-colors`}
        />
      </button>

      <Link
        to={ROUTES.PRODUCT(product.id)}
        className="h-48 w-full bg-white overflow-hidden cursor-pointer relative block"
        aria-label={`Ver detalhes de ${product.name}`}
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain transform hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {product.discount && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              {product.discount}% OFF
            </span>
          )}
          {product.isNew && (
            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              NOVO
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              MAIS VENDIDO
            </span>
          )}
        </div>
        {product.stock < 5 && (
          <span className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">
            Poucas unidades
          </span>
        )}
      </Link>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs text-agro-600 font-semibold uppercase tracking-wide">
            {product.category}
          </span>
          <StarRating rating={product.rating} count={product.reviewCount} />
        </div>

        <Link to={ROUTES.PRODUCT(product.id)} className="hover:text-agro-600 block">
          <h3 className="text-gray-900 font-semibold text-lg leading-tight mb-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400">À vista</span>
            <div className="flex items-baseline gap-2">
              {product.oldPrice && (
                <span className="text-xs text-gray-400 line-through">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.oldPrice)}
                </span>
              )}
              <span className="text-xl font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
              </span>
            </div>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            className="bg-agro-600 hover:bg-agro-800 text-white p-2.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-agro-500"
            aria-label="Adicionar ao carrinho"
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;

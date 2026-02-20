import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { ROUTES } from '@/constants/routes';
import { useProducts } from '@/hooks/useCatalogProducts';
import { ShoppingCart, ArrowRight } from 'lucide-react';

import Image from './Image';

interface RelatedProductsProps {
  currentProduct: Product;
  onAddToCart: (product: Product, quantity?: number) => void;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  currentProduct,
  onAddToCart
}) => {
  const { products: catalogProducts } = useProducts({
    category: currentProduct.category,
    pageSize: 8,
    inStock: false
  });

  const related = catalogProducts
    .filter(p => p.id !== currentProduct.id)
    .slice(0, 4);

  if (related.length === 0) return null;

  return (
    <div className="mt-12 border-t border-gray-100 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          Quem comprou, também levou
        </h3>
        {/* Decorative arrow implies flow */}
        <ArrowRight className="text-gray-300 hidden sm:block" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {related.map(product => (
          <div
            key={product.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col"
          >
            <Link
              to={ROUTES.PRODUCT(product.id)}
              className="h-32 bg-gray-100 relative cursor-pointer group block"
            >
              <Image
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            <div className="p-3 flex-1 flex flex-col">
              <span className="text-[10px] text-agro-600 font-bold uppercase tracking-wider mb-1 truncate">
                {product.category}
              </span>
              <Link
                to={ROUTES.PRODUCT(product.id)}
                className="text-sm font-medium text-gray-900 leading-snug mb-2 line-clamp-2 cursor-pointer hover:text-agro-700 block"
              >
                {product.name}
              </Link>

              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="text-sm font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-50 text-agro-600 hover:bg-agro-600 hover:text-white flex items-center justify-center transition-colors border border-gray-200 hover:border-agro-600"
                  title="Adicionar ao carrinho"
                >
                  <ShoppingCart size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;

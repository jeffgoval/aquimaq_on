import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import StarRating from './StarRating';
import { CheckCircle, ThumbsUp, User } from 'lucide-react';
import { getReviewsByProductId } from '@/services/reviewService';
import type { ReviewWithProfile } from '@/services/reviewService';

interface ProductReviewsProps {
  product: Product;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ product }) => {
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getReviewsByProductId(product.id);
        setReviews(data);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [product.id]);

  return (
    <div className="mt-8 border-t border-gray-100 pt-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Avaliações dos Clientes</h3>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3 bg-gray-50 p-6 rounded-lg h-fit">
          <div className="text-center mb-4">
            <span className="text-5xl font-bold text-gray-900 block">{product.rating}</span>
            <div className="flex justify-center my-2">
              <StarRating rating={product.rating} size={24} showCount={false} />
            </div>
            <span className="text-sm text-gray-500 block">Baseado em {product.reviewCount} avaliações</span>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = reviews.filter(r => r.rating === stars).length;
              const pct = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={stars} className="flex items-center text-xs">
                  <span className="w-3">{stars}</span>
                  <StarRating rating={stars} size={10} showCount={false} />
                  <div className="flex-1 h-2 mx-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista de Comentários */}
        <div className="md:w-2/3 space-y-8">
          <div className="space-y-6">
            {loading ? (
              <p className="text-center text-gray-500">Carregando avaliações...</p>
            ) : reviews.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Este produto ainda não tem avaliações.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 flex items-center gap-1">
                        <User size={14} className="text-gray-400" />
                        {review.profiles?.name ?? 'Cliente'}
                      </span>
                      {review.verified_purchase && (
                        <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                          <CheckCircle size={10} /> Compra Verificada
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="mb-2">
                    <StarRating rating={review.rating} size={12} showCount={false} />
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    {review.comment}
                  </p>

                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                      <ThumbsUp size={12} /> Útil
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import ProductDetail from '@/components/ProductDetail';
import { useCart } from '@/features/cart';
import { useProduct } from '../hooks/useProduct';
import ProductSkeleton from '@/components/ProductSkeleton';

const ProductPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const { product, isLoading, error } = useProduct(id);

    if (isLoading) {
        return <ProductSkeleton />;
    }

    if (error || !product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Produto não encontrado'}</h2>
                <button
                    onClick={() => navigate(ROUTES.HOME)}
                    className="text-agro-600 hover:underline"
                >
                    Voltar ao catálogo
                </button>
            </div>
        );
    }

    return (
        <ProductDetail
            product={product}
            onAddToCart={addToCart}
        />
    );
};

export default ProductPage;

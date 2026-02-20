import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useWishlist } from '@/contexts/WishlistContext';
import { useProducts as useCatalogProducts } from '@/hooks/useCatalogProducts';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/features/cart';
import { useToast } from '@/contexts/ToastContext';
import { Heart, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const WishlistPage: React.FC = () => {
    const { wishlist, loading } = useWishlist();
    const { products } = useCatalogProducts();
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const wishlistProducts = products.filter(p => wishlist.includes(p.id));

    const handleAddToCart = (product: any) => {
        addToCart(product, 1);
        showToast(`"${product.name}" adicionado ao carrinho!`, 'success');
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <Helmet>
                <title>Meus Favoritos | Aquimaq</title>
                <meta name="description" content="Sua lista de desejos na Aquimaq." />
            </Helmet>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <Link to="/" className="hover:text-agro-600 flex items-center gap-1">
                        <Home size={14} /> Início
                    </Link>
                    <span>/</span>
                    <span className="font-semibold text-gray-900">Favoritos</span>
                </div>

                <div className="flex items-center gap-3 mb-8">
                    <Heart className="text-agro-600 fill-agro-600" size={32} />
                    <h1 className="text-3xl font-bold text-gray-900">Meus Favoritos</h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-agro-600"></div>
                    </div>
                ) : wishlist.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart className="text-gray-400" size={32} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sua lista de desejos está vazia</h2>
                        <p className="text-gray-500 mb-6">
                            Salve os produtos que você mais gostou para ver depois.
                        </p>
                        <Link to="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-agro-600 hover:bg-agro-700">
                            Explorar Produtos
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {wishlistProducts.length > 0 ? (
                            wishlistProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-10 bg-white rounded-lg border border-gray-200">
                                <p className="text-gray-500">
                                    Não foi possível carregar os detalhes dos produtos favoritos. Tente novamente mais tarde.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, MessageCircle, FileText, ExternalLink } from 'lucide-react';
import { Product } from '@/types';
import ProductImageGallery from './product/ProductImageGallery';
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
import { useAuth } from '@/contexts/AuthContext';

interface ProductDetailProps {
    product: Product;
    onAddToCart: (product: Product, quantity?: number) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({
    product,
    onAddToCart
}) => {
    const navigate = useNavigate();
    const { settings } = useStore();
    const { session } = useAuth();
    const [quantity, setQuantity] = useState(1);
    const { documents: productDocs, loading: docsLoading } = useProductDocuments(product.id);
    const { cultures: availableCultures } = useCropCalendar();

    useEffect(() => {
        setQuantity(1);
    }, [product.id]);

    const whatsappNumber = settings?.phone?.replace(/\D/g, '') ?? import.meta.env.VITE_WHATSAPP_NUMBER ?? '';

    // Combine main image with gallery
    const galleryImages = product.gallery
        ? [product.imageUrl, ...product.gallery]
        : [product.imageUrl];

    const isOutOfStock = product.stock === 0;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ProductSEO product={product} />
            <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-agro-600 mb-6 transition-colors"
            >
                <ChevronLeft size={20} className="mr-1" /> Voltar ao catálogo
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden md:flex">
                {/* Gallery Section */}
                <div className="md:w-1/2 bg-gray-50 border-r border-gray-100">
                    <ProductImageGallery
                        images={galleryImages}
                        productName={product.name}
                    />
                </div>

                <div className="p-6 md:p-8 md:w-1/2 flex flex-col">
                    <span className="text-sm text-agro-600 font-bold uppercase tracking-wider mb-2">
                        {product.category}
                    </span>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

                    {/* Star Rating no detalhe */}
                    <div className="mb-4">
                        <StarRating rating={product.rating} count={product.reviewCount} size={18} />
                    </div>

                    <div className="prose prose-sm text-gray-600 mb-6">
                        <p>{product.description}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Especificações Técnicas</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            {product.technicalSpecs}
                        </p>
                    </div>

                    {!docsLoading && productDocs.length > 0 && (
                        <div className="bg-agro-50/50 p-4 rounded-lg border border-agro-100 mb-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <FileText size={16} className="text-agro-600" />
                                Bula e Ficha técnica
                            </h3>
                            <ul className="space-y-2">
                                {productDocs.map((doc) => (
                                    <li key={doc.id}>
                                        <a
                                            href={doc.file_url!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm font-medium text-agro-700 hover:text-agro-800 hover:underline"
                                        >
                                            {doc.doc_type === 'bula' ? 'Bula' : 'Ficha técnica'}: {doc.title}
                                            <ExternalLink size={14} />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mt-auto pt-6 border-t border-gray-100">
                        <div className="mb-6">
                            {product.oldPrice && (
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-gray-400 text-sm line-through">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.oldPrice)}
                                    </span>
                                    {product.discount && (
                                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                            -{product.discount}%
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-extrabold text-gray-900">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                </span>
                            </div>
                            <p className="text-agro-600 text-sm font-semibold mt-1">
                                ou 10x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price / 10)} sem juros
                            </p>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-semibold text-gray-700">Quantidade</p>
                                {product.stock !== undefined && (
                                    <p className={`text-xs font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {product.stock > 0 ? `Estoque: ${product.stock} disponíveis` : 'Produto indisponível'}
                                    </p>
                                )}
                            </div>
                            <QuantitySelector
                                value={quantity}
                                min={1}
                                max={Math.max(1, product.stock ?? 1)}
                                onChange={setQuantity}
                                showMaxMessage={true}
                                disabled={isOutOfStock}
                            />
                        </div>

                        <div className="flex flex-col gap-3 mb-4">
                            <button
                                onClick={() => onAddToCart(product, quantity)}
                                disabled={isOutOfStock}
                                className="w-full bg-agro-600 text-white py-3.5 rounded-lg font-bold text-lg hover:bg-agro-700 transition-colors shadow-lg shadow-agro-200 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                <ShoppingCart className="mr-2" />
                                {isOutOfStock ? 'Indisponível' : 'Adicionar ao Carrinho'}
                            </button>

                            <button
                                onClick={() => {
                                    if (!session) {
                                        onAddToCart(product, quantity);
                                        navigate('/login?redirect=/checkout');
                                        return;
                                    }
                                    onAddToCart(product, quantity);
                                    navigate('/checkout');
                                }}
                                disabled={isOutOfStock}
                                className="w-full bg-orange-600 text-white py-3.5 rounded-lg font-bold text-lg hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                {isOutOfStock ? 'Indisponível' : 'Comprar Agora'}
                            </button>
                        </div>

                        {whatsappNumber && (
                            <a
                                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                                    `Olá! Gostaria de negociar o produto:\n\n📦 *${product.name}*\nID: ${product.id}\nPreço: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}\n\nPodemos conversar sobre condições especiais?`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-base hover:bg-green-700 transition-colors shadow-md flex items-center justify-center mb-4"
                            >
                                <MessageCircle className="mr-2" size={20} />
                                Negociar este produto no Zap
                            </a>
                        )}

                        <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                            <div className="flex flex-col items-center">
                                <span className="font-semibold text-gray-700">🔒 Compra Segura</span>
                            </div>
                            <div className="flex flex-col items-center border-l border-gray-200">
                                <span className="font-semibold text-gray-700">🚚 Envio Rápido</span>
                            </div>
                            <div className="flex flex-col items-center border-l border-gray-200">
                                <span className="font-semibold text-gray-700">💳 10x Sem Juros</span>
                            </div>
                        </div>


                    </div>
                </div>
            </div>

            {/* --- Product Reviews Section --- */}
            <ProductReviews product={product} />

            {/* --- Cross Selling Section --- */}
            <RelatedProducts
                currentProduct={product}
                onAddToCart={onAddToCart}
            />

            {/* --- Recomendados para a cultura do produto --- */}
            {product.culture && (
                <RecommendationsByCulture
                    culture={product.culture}
                    availableCultures={availableCultures}
                    excludeProductId={product.id}
                    onAddToCart={onAddToCart}
                    limit={4}
                />
            )}
        </div>
    );
};

export default ProductDetail;


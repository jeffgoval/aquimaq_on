import React, { useState } from 'react';
import type { ChatMessageData } from '@/hooks/useChat';
import type { ChatProduct } from '@/services/chatService';
import { useCart } from '@/features/cart/context/CartContext';
import { useToast } from '@/contexts/ToastContext';
import type { Product } from '@/types';
import { ProductCategory } from '@/types';
import { ShoppingCart, Check, Package } from 'lucide-react';

interface ChatMessageProps {
    message: ChatMessageData;
}

/** Constrói um objeto Product mínimo a partir dos dados da IA para addToCart. */
function buildProductFromChat(p: ChatProduct): Product {
    return {
        id: p.id,
        name: p.name,
        price: p.price,
        description: '',
        technicalSpecs: '',
        category: ProductCategory.PARTS,
        imageUrl: p.image_url ?? '',
        stock: 1,
        rating: 0,
        reviewCount: 0,
    };
}

function ProductCard({ product }: { product: ChatProduct }) {
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const [added, setAdded] = useState(false);

    const handleAdd = () => {
        addToCart(buildProductFromChat(product), 1);
        setAdded(true);
        showToast(`"${product.name}" adicionado ao carrinho!`, 'success');
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 mt-2 shadow-sm">
            {product.image_url ? (
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                />
            ) : (
                <div className="w-12 h-12 rounded-md bg-agro-50 flex items-center justify-center flex-shrink-0">
                    <Package size={20} className="text-agro-600" />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                <p className="text-sm font-bold text-agro-700">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                </p>
            </div>

            <button
                onClick={handleAdd}
                disabled={added}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex-shrink-0 ${added
                        ? 'bg-agro-100 text-agro-700 cursor-default'
                        : 'bg-agro-600 hover:bg-agro-700 text-white active:scale-95 shadow-sm'
                    }`}
            >
                {added ? (
                    <>
                        <Check size={14} />
                        Adicionado
                    </>
                ) : (
                    <>
                        <ShoppingCart size={14} />
                        Adicionar
                    </>
                )}
            </button>
        </div>
    );
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
            <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isUser
                        ? 'bg-agro-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}
            >
                {/* Mensagem de texto */}
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Cards de produtos recomendados */}
                {message.products && message.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {message.products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

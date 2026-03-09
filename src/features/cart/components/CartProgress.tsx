import React from 'react';
import { CartItem } from '@/types';
import { Award } from 'lucide-react';

interface CartProgressProps {
    items: CartItem[];
}

const CartProgress: React.FC<CartProgressProps> = ({ items }) => {
    // 1. Identificar itens com configuração de atacado
    const wholesaleItems = items.filter(i => i.wholesaleMinAmount && i.wholesaleMinAmount > 0);

    if (wholesaleItems.length === 0) return null;

    // 2. Encontrar o item mais próximo de atingir a meta (que ainda não atingiu)
    let bestCandidate: { item: CartItem; missing: number; goal: number; currentTotal: number } | null = null;
    let minMissingPercent = 100;

    // Conta quantos já atingiram a meta
    let successCount = 0;

    wholesaleItems.forEach(item => {
        const currentTotal = item.price * item.quantity;
        const goal = item.wholesaleMinAmount!;

        if (currentTotal >= goal) {
            successCount++;
        } else {
            const missing = goal - currentTotal;
            const percentMissing = (missing / goal) * 100;
            // Prioriza mostrar o que está mais perto (menor percentual faltando)
            if (percentMissing < minMissingPercent) {
                minMissingPercent = percentMissing;
                bestCandidate = { item, missing, goal, currentTotal };
            }
        }
    });

    // Se todos os itens elegíveis já atingiram a meta
    if (successCount > 0 && !bestCandidate) {
        return (
            <div className="bg-emerald-50 p-4 rounded-lg shadow-sm border border-emerald-100 mb-4 animate-in slide-in-from-top-2">
                <p className="text-emerald-700 font-bold text-center flex items-center justify-center gap-2">
                    <Award size={18} /> Parabéns! Você garantiu preços de atacado nos seus itens!
                </p>
                <p className="text-emerald-600 text-xs text-center mt-1">
                    O desconto foi aplicado automaticamente no subtotal.
                </p>
            </div>
        );
    }

    // Se tem um candidato para incentivar (mostra apenas o mais próximo para não poluir)
    if (bestCandidate) {
        const { item, missing, goal, currentTotal } = bestCandidate;
        const progress = Math.min((currentTotal / goal) * 100, 100);

        return (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-agro-100 mb-4 animate-in slide-in-from-top-2 duration-500">
                <div className="flex justify-between items-end text-sm mb-2">
                    <div className="flex flex-col max-w-[80%]">
                        <span className="text-xs text-gray-500 uppercase font-semibold">Oferta de Atacado</span>
                        <span className="font-medium text-gray-800 truncate">
                            {item.name}
                        </span>
                    </div>
                    <span className="text-agro-600 font-bold">{progress.toFixed(0)}%</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-agro-400 to-agro-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <p className="text-sm text-center font-medium">
                    <span className="text-gray-600">
                        Adicione mais <span className="text-agro-700 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(missing)}</span> deste item para ganhar <span className="text-green-600">{item.wholesaleDiscountPercent}% OFF!</span>
                    </span>
                </p>
            </div>
        );
    }

    return null;
};

export default CartProgress;

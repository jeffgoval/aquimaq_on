import { supabase } from '@/services/supabase';
import { CartItem } from '@/types';

/** Verifica disponibilidade de estoque para itens do carrinho */
export const checkStockAvailability = async (cart: CartItem[]): Promise<void> => {
    const ids = cart.map(c => c.id);
    const { data, error } = await supabase
        .from('products')
        .select('id, stock, name')
        .in('id', ids);

    if (error) {
        console.error('Error checking stock:', error);
        throw new Error('Erro ao verificar estoque.');
    }

    const products = data || [];
    for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (!product) {
            throw new Error(`Produto "${item.name}" não está mais disponível.`);
        }
        if (product.stock < item.quantity) {
            throw new Error(`Estoque insuficiente para "${item.name}". Restam apenas ${product.stock} unidades.`);
        }
    }
};

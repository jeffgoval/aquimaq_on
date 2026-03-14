import { supabase } from './supabase';

/**
 * Regista ou atualiza pedido de notificação quando o produto voltar ao stock.
 */
export async function upsertStockNotification(
  productId: string,
  userId: string,
  email: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('stock_notifications').upsert(
    {
      product_id: productId,
      user_id: userId,
      email,
    },
    { onConflict: 'product_id,user_id' }
  );
  return { error: error ?? null };
}

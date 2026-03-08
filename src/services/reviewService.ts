import { supabase } from './supabase';
import type { ReviewRow } from '@/types/database';

export interface ReviewWithProfile extends ReviewRow {
  profiles?: { name: string | null };
}

/** Avaliações de um produto, ordenadas por data (mais recentes primeiro). */
export const getReviewsByProductId = async (
  productId: string
): Promise<ReviewWithProfile[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Could not fetch reviews', error);
    return [];
  }
  return (data as ReviewWithProfile[]) ?? [];
};

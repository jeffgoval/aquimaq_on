import { supabase } from './supabase';
import type { ReviewRow, TablesUpdate } from '@/types/database';

export interface ReviewWithProfile extends ReviewRow {
  profiles?: { name: string | null };
}

/** Avaliações de um produto, ordenadas por data (mais recentes primeiro). Só retorna visíveis. */
export const getReviewsByProductId = async (
  productId: string
): Promise<ReviewWithProfile[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(name)')
    .eq('product_id', productId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Could not fetch reviews', error);
    return [];
  }
  return (data as ReviewWithProfile[]) ?? [];
};

export interface GetReviewsForAdminParams {
  productId?: string;
  rating?: number;
  isVisible?: boolean;
}

export interface ReviewForAdmin extends ReviewWithProfile {
  products?: { name: string | null } | null;
}

/** Lista avaliações para moderação (admin/gerente). */
export const getReviewsForAdmin = async (
  params: GetReviewsForAdminParams = {}
): Promise<ReviewForAdmin[]> => {
  let query = supabase
    .from('reviews')
    .select('*, profiles(name), products(name)')
    .order('created_at', { ascending: false });

  if (params.productId) query = query.eq('product_id', params.productId);
  if (params.rating != null) query = query.eq('rating', params.rating);
  if (params.isVisible !== undefined) query = query.eq('is_visible', params.isVisible);

  const { data, error } = await query;
  if (error) throw error;
  return (data as ReviewForAdmin[]) ?? [];
};

/** Oculta ou exibe uma avaliação (moderação). */
export const setReviewVisibility = async (
  id: string,
  isVisible: boolean
): Promise<{ error: Error | null }> => {
  const { error } = await supabase
    .from('reviews')
    .update({ is_visible: isVisible } as TablesUpdate<'reviews'>)
    .eq('id', id);
  return { error: error as unknown as Error | null };
};

/** Remove uma avaliação (admin/gerente). */
export const deleteReview = async (id: string): Promise<{ error: Error | null }> => {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  return { error: error as unknown as Error | null };
};

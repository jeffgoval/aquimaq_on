import { supabase } from './supabase';

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_text: string | null;
  cta_link: string | null;
  color_gradient: string;
  position?: number;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  seasonal_context?: string | null;
}

/** Banners ativos para o hero (período vigente). Se seasonalContext for passado, só retorna banners cujo seasonal_context é null ou igual. */
export const getActiveBanners = async (seasonalContext?: string | null): Promise<Banner[]> => {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error loading banners:', error);
    return [];
  }
  const now = Date.now();
  const rows = (data as Banner[]) ?? [];
  return rows.filter((banner) => {
    const startsAt = banner.starts_at ? new Date(banner.starts_at).getTime() : null;
    const endsAt = banner.ends_at ? new Date(banner.ends_at).getTime() : null;
    const startsOk = startsAt == null || startsAt <= now;
    const endsOk = endsAt == null || endsAt >= now;
    const dateOk = startsOk && endsOk;
    if (!dateOk) return false;
    if (seasonalContext && seasonalContext !== 'OFF') {
      return banner.seasonal_context == null || banner.seasonal_context === seasonalContext;
    }
    return true;
  });
};

/** Todos os banners (admin). */
export const getBanners = async (): Promise<Banner[]> => {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('position', { ascending: true });

  if (error) throw error;
  return (data as Banner[]) ?? [];
};

export interface BannerPayload {
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_text: string | null;
  cta_link: string | null;
  color_gradient: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  position: number;
  seasonal_context?: string | null;
}

export const createBanner = async (
  payload: BannerPayload
): Promise<void> => {
  const { error } = await supabase.from('banners').insert(payload);
  if (error) throw error;
};

export const updateBanner = async (
  id: string,
  payload: Partial<BannerPayload>
): Promise<void> => {
  const { error } = await supabase
    .from('banners')
    .update(payload)
    .eq('id', id);
  if (error) throw error;
};

export const deleteBanner = async (id: string): Promise<void> => {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw error;
};

export const toggleBannerActive = async (
  id: string,
  isActive: boolean
): Promise<void> => {
  const { error } = await supabase
    .from('banners')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) throw error;
};

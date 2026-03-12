import { supabase } from './supabase';
import type { CropCalendarRow, TablesInsert, TablesUpdate } from '@/types/database';

export const getCropCalendar = async (): Promise<CropCalendarRow[]> => {
  const { data, error } = await supabase
    .from('crop_calendar')
    .select('*')
    .order('culture');

  if (error) throw error;
  return (data as CropCalendarRow[]) ?? [];
};

export const createCropCalendarRow = async (
  row: Omit<TablesInsert<'crop_calendar'>, 'id' | 'created_at'>
): Promise<{ data: CropCalendarRow | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('crop_calendar')
    .insert(row as TablesInsert<'crop_calendar'>)
    .select()
    .single();

  if (error) return { data: null, error: error as unknown as Error };
  return { data: data as CropCalendarRow, error: null };
};

export const updateCropCalendarRow = async (
  id: string,
  updates: Partial<TablesUpdate<'crop_calendar'>>
): Promise<{ data: CropCalendarRow | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('crop_calendar')
    .update(updates as TablesUpdate<'crop_calendar'>)
    .eq('id', id)
    .select()
    .single();

  if (error) return { data: null, error: error as unknown as Error };
  return { data: data as CropCalendarRow, error: null };
};

export const deleteCropCalendarRow = async (id: string): Promise<{ error: Error | null }> => {
  const { error } = await supabase.from('crop_calendar').delete().eq('id', id);
  return { error: error as unknown as Error | null };
};

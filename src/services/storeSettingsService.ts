import { supabase } from './supabase';
import type { TablesUpdate, TablesInsert } from '@/types/database';
import type { StoreSettings } from '@/types/store';
import {
  storeSettingsFromDB,
  storeSettingsToDB,
  type StoreSettingsDB,
} from '@/types/store';

/** Configurações da loja (uma única linha). */
export const getStoreSettings = async (): Promise<StoreSettings | null> => {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Store settings fetch error:', error);
    return null;
  }
  return storeSettingsFromDB(data as unknown as StoreSettingsDB | null);
};

/** Cria ou atualiza configurações da loja. */
export const saveStoreSettings = async (
  partial: Partial<StoreSettings>
): Promise<{ success: boolean; error?: string }> => {
  const payload = {
    ...storeSettingsToDB(partial),
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('store_settings')
    .select('id')
    .maybeSingle();

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('store_settings')
      .update(payload as unknown as TablesUpdate<'store_settings'>)
      .eq('id', existing.id);

    if (updateError) {
      console.error('Store settings save error:', updateError);
      return { success: false, error: updateError.message };
    }
  } else {
    const { error: insertError } = await supabase
      .from('store_settings')
      .insert(payload as unknown as TablesInsert<'store_settings'>);

    if (insertError) {
      console.error('Store settings save error:', insertError);
      return { success: false, error: insertError.message };
    }
  }
  return { success: true };
};

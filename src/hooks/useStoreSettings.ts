import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import type { StoreSettings } from '@/types/store';
import {
  storeSettingsFromDB,
  storeSettingsToDB,
  type StoreSettingsDB,
} from '@/types/store';

export type { StoreSettings } from '@/types/store';

export const useStoreSettings = () => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('store_settings')
          .select('*')
          .maybeSingle();

        if (fetchError) {
          console.error('Store settings fetch error:', fetchError);
          setError('Falha ao carregar configurações da loja');
          setSettings(null);
          return;
        }

        setSettings(storeSettingsFromDB(data as StoreSettingsDB | null));
      } catch (err) {
        console.error(err);
        setError('Falha ao carregar configurações da loja');
        setSettings(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const saveSettings = useCallback(
    async (
      partial: Partial<StoreSettings>
    ): Promise<{ success: boolean; error?: string }> => {
      try {
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
            .update(payload)
            .eq('id', existing.id);

          if (updateError) {
            console.error('Store settings save error:', updateError);
            return { success: false, error: updateError.message };
          }
        } else {
          const { error: insertError } = await supabase
            .from('store_settings')
            .insert(payload);

          if (insertError) {
            console.error('Store settings save error:', insertError);
            return { success: false, error: insertError.message };
          }
        }

        const next = settings
          ? { ...settings, ...partial }
          : (partial as StoreSettings);
        setSettings(next);
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao salvar configurações';
        return { success: false, error: message };
      }
    },
    [settings]
  );

  return { settings, isLoading, error, saveSettings };
};

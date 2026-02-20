import { useState, useEffect, useCallback } from 'react';
import { getStoreSettings, saveStoreSettings } from '@/services/storeSettingsService';
import type { StoreSettings } from '@/types/store';

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
        const data = await getStoreSettings();
        setSettings(data);
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
      const result = await saveStoreSettings(partial);
      if (result.success) {
        const next = settings
          ? { ...settings, ...partial }
          : (partial as StoreSettings);
        setSettings(next);
      }
      return result;
    },
    [settings]
  );

  return { settings, isLoading, error, saveSettings };
};

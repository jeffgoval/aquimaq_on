import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/services/supabase';
import type { CropCalendarRow } from '@/types/database';

export interface UseCropCalendarResult {
  cultures: string[];
  culturesInSeasonThisMonth: string[];
  isLoading: boolean;
  error: string | null;
}

function isCultureInSeasonForMonth(row: CropCalendarRow, month: number): boolean {
  const inPlant = month >= row.month_plant_start && month <= row.month_plant_end;
  const inHarvest = month >= row.month_harvest_start && month <= row.month_harvest_end;
  return inPlant || inHarvest;
}

const CACHE_KEY = 'crop_calendar_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface CacheData {
  data: CropCalendarRow[];
  timestamp: number;
}

const getCachedData = (): CropCalendarRow[] | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed: CacheData = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
};

const setCachedData = (data: CropCalendarRow[]) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // ignore
  }
};

export function useCropCalendar(): UseCropCalendarResult {
  const [rows, setRows] = useState<CropCalendarRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchCalendar = async () => {
      const cached = getCachedData();
      if (cached) {
        if (mounted) {
          setRows(cached);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error: err } = await supabase
          .from('crop_calendar')
          .select('*')
          .order('culture');

        if (!mounted) return;

        if (err) {
          setError(err.message);
          return;
        }

        const result = (data as CropCalendarRow[]) ?? [];
        setRows(result);
        setCachedData(result);
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchCalendar();

    return () => { mounted = false; };
  }, []);

  const cultures = useMemo(
    () => Array.from(new Set(rows.map((r) => r.culture))).sort(),
    [rows]
  );

  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);

  const culturesInSeasonThisMonth = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .filter((r) => isCultureInSeasonForMonth(r, currentMonth))
            .map((r) => r.culture)
        )
      ),
    [rows, currentMonth]
  );

  return {
    cultures,
    culturesInSeasonThisMonth,
    isLoading,
    error,
  };
}

import type { CropCalendarRow } from '@/types/database';

export const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const MONTHS_FULL = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function formatMonthRange(start: number, end: number): string {
    if (start === end) return MONTHS_SHORT[start - 1];
    return `${MONTHS_SHORT[start - 1]}–${MONTHS_SHORT[end - 1]}`;
}

export type SeasonalStatus = 'em_safra' | 'pre_safra' | 'entressafra';

/**
 * Determina o status sazonal de um produto baseado no calendário de safra e mês atual.
 * - em_safra: mês atual está dentro do período de plantio ou colheita
 * - pre_safra: 1-2 meses antes do início do plantio
 * - entressafra: fora de todos os períodos ativos
 */
export function getSeasonalStatus(
    row: CropCalendarRow | undefined,
    month: number,
): SeasonalStatus | null {
    if (!row) return null;

    const inPlant = month >= row.month_plant_start && month <= row.month_plant_end;
    const inHarvest = month >= row.month_harvest_start && month <= row.month_harvest_end;
    if (inPlant || inHarvest) return 'em_safra';

    // Verifica se estamos 1-2 meses antes do início do plantio
    const monthsUntilPlant = (row.month_plant_start - month + 12) % 12;
    if (monthsUntilPlant >= 1 && monthsUntilPlant <= 2) return 'pre_safra';

    return 'entressafra';
}

export const SEASONAL_STATUS_LABEL: Record<SeasonalStatus, string> = {
    em_safra: 'Em Safra',
    pre_safra: 'Pré-Safra',
    entressafra: 'Entressafra',
};

export const SEASONAL_STATUS_COLORS: Record<SeasonalStatus, string> = {
    em_safra: 'bg-emerald-500 text-white',
    pre_safra: 'bg-sky-500 text-white',
    entressafra: 'bg-amber-500 text-white',
};

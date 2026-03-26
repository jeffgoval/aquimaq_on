const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

/**
 * Formata um valor numérico como moeda em BRL (R$).
 * Reutiliza uma única instância de Intl.NumberFormat para evitar recriação no JSX.
 */
export const formatCurrency = (value: number): string => BRL_FORMATTER.format(value);

/**
 * Formata uma ISO string como "dd/mm/aaaa, HH:MM".
 */
export const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

/**
 * Formata uma ISO string como "dd/mm/aaaa" (sem horário).
 */
export const formatShortDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('pt-BR');


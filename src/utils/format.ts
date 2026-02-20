const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

/**
 * Formata um valor numérico como moeda em BRL (R$).
 * Reutiliza uma única instância de Intl.NumberFormat para evitar recriação no JSX.
 */
export const formatCurrency = (value: number): string => BRL_FORMATTER.format(value);

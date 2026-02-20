import { ProductCategory } from '@/types';

/**
 * Lê o parâmetro category da URL (?category=...) e devolve ProductCategory | 'ALL'.
 */
export function parseCategoryFromUrl(value: string | null): ProductCategory | 'ALL' {
    if (!value || value === 'ALL') return 'ALL';
    return Object.values(ProductCategory).includes(value as ProductCategory)
        ? (value as ProductCategory)
        : 'ALL';
}


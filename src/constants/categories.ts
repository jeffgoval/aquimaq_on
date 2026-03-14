import { ProductCategory } from '@/types';

export interface CategoryOption {
  value: string;
  label: string;
}

/** Opções para filtro de categorias no admin (valor 'all' + valores do enum). */
export const ADMIN_CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'all', label: 'Todas as categorias' },
  ...Object.entries(ProductCategory).map(([_, label]) => ({
    value: label,
    label,
  })),
];

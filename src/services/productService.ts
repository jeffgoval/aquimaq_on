import { supabase } from './supabase';
import { mapProductRowToProduct } from '@/features/catalog/utils/productAdapter';
import type { ProductRow, CropCalendarRow } from '@/types/database';
import type { Product, ProductCategory } from '@/types';

export type ProductSortOption =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'best_sellers';

export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  category?: ProductCategory | null | 'ALL';
  searchQuery?: string;
  sortBy?: ProductSortOption;
  selectedBrands?: string[];
  inStock?: boolean;
  culture?: string | null;
  inSeason?: boolean;
  culturesInSeason?: string[];
}

export interface GetProductsResult {
  data: Product[];
  count: number;
}

/** Lista produtos com filtros, ordenação e paginação (catálogo). */
export const getProducts = async (
  params: GetProductsParams = {}
): Promise<GetProductsResult> => {
  const {
    page = 1,
    pageSize = 12,
    category,
    searchQuery = '',
    sortBy = 'relevance',
    selectedBrands = [],
    inStock = false,
    culture = null,
    inSeason = false,
    culturesInSeason = [],
  } = params;

  let query = supabase.from('products').select('*', { count: 'exact' });

  if (category && category !== 'ALL') {
    query = query.eq('category', category);
  }
  if (inStock) {
    query = query.gt('stock', 0);
  }
  if (culture) {
    query = query.ilike('culture', culture);
  }
  if (inSeason && culturesInSeason.length > 0) {
    query = query.in('culture', culturesInSeason);
  }
  if (searchQuery) {
    const q = `%${searchQuery}%`;
    query = query.or(
      `name.ilike.${q},description.ilike.${q},brand.ilike.${q}`
    );
  }
  if (selectedBrands?.length > 0) {
    query = query.in('brand', selectedBrands);
  }

  switch (sortBy) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'newest':
      query = query
        .order('is_new', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      break;
    case 'best_sellers':
      query = query
        .order('is_best_seller', { ascending: false, nullsFirst: false })
        .order('review_count', { ascending: false });
      break;
    case 'relevance':
    default:
      query = query
        .order('is_best_seller', { ascending: false, nullsFirst: false })
        .order('rating', { ascending: false, nullsFirst: false });
      break;
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  const rows = (data as ProductRow[]) ?? [];
  return {
    data: rows.map(mapProductRowToProduct),
    count: count ?? 0,
  };
};

/** Busca um produto por ID (página de detalhe). */
export const getProductById = async (
  id: string
): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapProductRowToProduct(data as ProductRow);
};

/** Busca linha bruta do produto por ID (admin/editor). */
export const getProductRowById = async (
  id: string
): Promise<ProductRow | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as ProductRow;
};

/** Lista produtos para admin (todos, ordenados por nome).
 *  @param vendedorId - quando informado, filtra apenas produtos deste vendedor
 */
export const getProductsAdmin = async (vendedorId?: string): Promise<ProductRow[]> => {
  let query = supabase.from('products').select('*').order('name');
  if (vendedorId) {
    query = (query as any).eq('vendedor_id', vendedorId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data as ProductRow[]) ?? [];
};

/** Cria um novo produto. */
export const createProduct = async (
  payload: Record<string, unknown>
): Promise<void> => {
  const { error } = await supabase.from('products').insert(payload);
  if (error) throw error;
};

/** Atualiza um produto por ID. */
export const updateProduct = async (
  id: string,
  payload: Record<string, unknown>
): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id);
  if (error) throw error;
};

export interface ProductDocument {
  id: string;
  file_url: string | null;
  doc_type: string;
  title: string;
}

/** Documentos de um produto (manuais, fichas). */
export const getProductDocuments = async (
  productId: string
): Promise<ProductDocument[]> => {
  const { data, error } = await supabase
    .from('product_documents')
    .select('id, file_url, doc_type, title')
    .eq('product_id', productId)
    .order('doc_type', { ascending: true });

  if (error) {
    console.warn('product_documents:', error.message);
    return [];
  }
  return (data as ProductDocument[]) ?? [];
};

/** Calendário de culturas (para filtro “em época”). */
export const getCropCalendar = async (): Promise<CropCalendarRow[]> => {
  const { data, error } = await supabase
    .from('crop_calendar')
    .select('*')
    .order('culture');

  if (error) throw error;
  return (data as CropCalendarRow[]) ?? [];
};

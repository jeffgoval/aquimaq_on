import { useState, useEffect } from 'react';
import { Product, ProductCategory } from '@/types';
import { supabase } from '@/services/supabase';
import { mapProductRowToProduct } from '../utils/productAdapter';
import type { ProductRow } from '@/types/database';

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'best_sellers';

interface UseProductsOptions {
    page?: number;
    pageSize?: number;
    category?: ProductCategory | null | 'ALL';
    searchQuery?: string;
    sortBy?: SortOption;
    selectedBrands?: string[];
    inStock?: boolean;
    culture?: string | null;
    inSeason?: boolean;
    culturesInSeason?: string[];
}

interface UseProductsResult {
    products: Product[];
    isLoading: boolean;
    error: string | null;
    totalCount: number;
    hasMore: boolean;
}

export const useProducts = ({
    page = 1,
    pageSize = 12,
    category,
    searchQuery = '',
    sortBy = 'relevance',
    selectedBrands = [],
    inStock = false,
    culture = null,
    inSeason = false,
    culturesInSeason = []
}: UseProductsOptions = {}): UseProductsResult => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const fetchProducts = async () => {
            setIsLoading(true);
            setError(null);

            try {
                let query = supabase
                    .from('products')
                    .select('*', { count: 'exact' });

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
                    query = query.or(`name.ilike.${q},description.ilike.${q},brand.ilike.${q}`);
                }
                if (selectedBrands && selectedBrands.length > 0) {
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
                        query = query.order('is_new', { ascending: false, nullsFirst: false })
                            .order('created_at', { ascending: false });
                        break;
                    case 'best_sellers':
                        query = query.order('is_best_seller', { ascending: false, nullsFirst: false })
                            .order('review_count', { ascending: false });
                        break;
                    case 'relevance':
                    default:
                        query = query.order('is_best_seller', { ascending: false, nullsFirst: false })
                            .order('rating', { ascending: false, nullsFirst: false });
                        break;
                }

                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                query = query.range(from, to);

                const { data, error: sbError, count } = await query;

                if (sbError) throw sbError;

                if (isMounted) {
                    const mappedProducts = (data as ProductRow[]).map(mapProductRowToProduct);
                    setProducts(mappedProducts);
                    setTotalCount(count || 0);
                }
            } catch (err: unknown) {
                if (isMounted) {
                    console.error('Erro ao buscar produtos:', err);
                    setError(err instanceof Error ? err.message : 'Falha ao carregar produtos.');
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void fetchProducts();

        return () => { isMounted = false; };
    }, [page, pageSize, category, searchQuery, sortBy, JSON.stringify(selectedBrands), inStock, culture, inSeason, JSON.stringify(culturesInSeason)]);

    return {
        products,
        isLoading,
        error,
        totalCount,
        hasMore: page * pageSize < totalCount,
    };
};

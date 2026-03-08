import { useState, useEffect } from 'react';
import { Product, ProductCategory } from '@/types';
import { getProducts } from '@/services/productService';
import type { ProductSortOption } from '@/services/productService';

export type SortOption = ProductSortOption;

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
                const { data, count } = await getProducts({
                    page,
                    pageSize,
                    category,
                    searchQuery,
                    sortBy,
                    selectedBrands,
                    inStock,
                    culture,
                    inSeason,
                    culturesInSeason,
                });

                if (isMounted) {
                    setProducts(data);
                    setTotalCount(count);
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

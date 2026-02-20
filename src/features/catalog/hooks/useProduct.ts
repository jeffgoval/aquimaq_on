import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { supabase } from '@/services/supabase';
import { mapProductRowToProduct } from '../utils/productAdapter';
import { ProductRow } from '@/types/database';

export const useProduct = (id: string | undefined) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        let isMounted = true;

        const fetchProduct = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const { data, error: sbError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (sbError) throw sbError;

                if (isMounted && data) {
                    setProduct(mapProductRowToProduct(data as ProductRow));
                }
            } catch (err: unknown) {
                if (isMounted) {
                    console.error('Erro ao carregar produto:', err);
                    setError(err instanceof Error ? err.message : 'Erro ao carregar produto');
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchProduct();

        return () => { isMounted = false; };
    }, [id]);

    return { product, isLoading, error };
};

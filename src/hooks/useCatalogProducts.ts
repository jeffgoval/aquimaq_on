
import { useState, useEffect } from 'react';
import { Product, ProductCategory } from '@/types';
import { supabase } from '@/services/supabase'; // Importe o client do Supabase
import { mapProductRowToProduct } from '@/utils/productAdapter';
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
    /** Filtro por cultura (ex.: Soja, Milho) */
    culture?: string | null;
    /** Mostrar apenas produtos cuja cultura está na safra no mês atual */
    inSeason?: boolean;
    /** Lista de culturas em safra no mês atual (usado quando inSeason = true) */
    culturesInSeason?: string[];
}

interface UseProductsResult {
    products: Product[];
    isLoading: boolean;
    error: string | null;
    totalCount: number;
    hasMore: boolean;
    availableBrands: string[]; // For filter UI
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
    const [availableBrands, setAvailableBrands] = useState<string[]>([]);

    // Effect para buscar produtos e metadados (preço min/max, marcas)
    useEffect(() => {
        let isMounted = true;

        const fetchProducts = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // 1. Construir query base
                let query = supabase
                    .from('products')
                    .select('*', { count: 'exact' });

                // 2. Aplicar Filtros
                if (category && category !== 'ALL') {
                    // Supabase não tem enum type nativo mapeado direto string->enum as vezes, 
                    // mas se o banco for text e o valor bater, funciona.
                    query = query.eq('category', category);
                }

                if (inStock) {
                    query = query.gt('stock', 0);
                }

                if (culture) {
                    // Busca case-insensitive
                    query = query.ilike('culture', culture);
                }

                if (inSeason && culturesInSeason.length > 0) {
                    // Filtra onde a cultura está na lista de safras
                    // Array de strings para 'in' deve funcionar se a coluna for text
                    query = query.in('culture', culturesInSeason);
                }

                if (searchQuery) {
                    // Busca textual simples em nome, descrição ou marca
                    // Sintaxe 'or' do Postgrest: coluna.operador.valor,coluna.operador.valor
                    const q = `%${searchQuery}%`;
                    query = query.or(`name.ilike.${q},description.ilike.${q},brand.ilike.${q}`);
                }

                if (selectedBrands && selectedBrands.length > 0) {
                    query = query.in('brand', selectedBrands);
                }



                // 3. Ordenação
                switch (sortBy) {
                    case 'price_asc':
                        query = query.order('price', { ascending: true });
                        break;
                    case 'price_desc':
                        query = query.order('price', { ascending: false });
                        break;
                    case 'newest':
                        // Assumindo created_at ou is_new
                        query = query.order('is_new', { ascending: false, nullsFirst: false })
                            .order('created_at', { ascending: false });
                        break;
                    case 'best_sellers':
                        query = query.order('is_best_seller', { ascending: false, nullsFirst: false })
                            .order('review_count', { ascending: false });
                        break;
                    case 'relevance':
                    default:
                        // Default relevance: best sellers first, then rating
                        // Se houver busca, o 'or' não ordena por relevância full-text search nativamente sem RPC,
                        // então usamos ordenação por popularidade
                        if (searchQuery) {
                            // Se tiver busca, talvez não queiramos forçar best_seller primeiro se não bater bem,
                            // mas sem Full Text Search rankeado, é difícil. Vamos manter simples.
                        }
                        query = query.order('is_best_seller', { ascending: false, nullsFirst: false })
                            .order('rating', { ascending: false, nullsFirst: false });
                        break;
                }

                // 4. Paginação
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                query = query.range(from, to);

                // Executar query principal
                const { data, error: sbError, count } = await query;

                if (sbError) throw sbError;

                if (isMounted) {
                    const mappedProducts = (data as ProductRow[]).map(mapProductRowToProduct);
                    setProducts(mappedProducts);
                    setTotalCount(count || 0);

                    // --- Carregar Facetas (Marcas e Preços) separadamente para não pesar ---
                    // Idealmente, isso seria uma RPC 'get_catalog_facets' para performance.
                    // Para MVP, faremos uma query leve para pegar todas as marcas/preços da CATEGORIA (ignorando outros filtros para mostrar o que existe)
                    // OU, simplificamos e pegamos dos dados atuais se a página for 1, mas isso limita as opções.
                    // Vamos fazer uma query secundária leve apenas para Brands se category mudar.

                    // TODO: Otimizar isso em produção com RPC function.
                    // Por enquanto, vamos extrair das estatísticas da query atual seria limitado à página.
                    // Vamos fazer uma fetch separada simples SEM paginação mas COM filtro de categoria/busca para popular filtros.
                    // Se o catalogo for muito grande, isso é perigoso. Vamos limitar a 1000 itens para facetas.

                    if (products.length === 0 && page === 1) {
                        // Se não tem produtos, limpa facetas
                        // setAvailableBrands([]);
                        // setPriceBounds([0, 10000]);
                    }

                    // Estratégia MVP segura: Pegar brands APENAS da categoria atual (sem filtro de preço/marca aplicado)
                    // Para não fazer request pesado todo render, poderíamos usar outro useEffect, mas vamos simplificar.
                    // Se a performance cair, movemos para RPC.
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

        // Função auxiliar para carregar Facetas (Marcas e Preços Globais da Categoria)
        // Executamos separadamente para popular os filtros laterais corretamente
        const fetchFacets = async () => {
            // Esta query deve ignorar filtros de preço/marca selecionados, mas respeitar categoria/busca
            // para mostrar ao usuário o que está disponível naquele contexto amplo.
            try {
                let facetQuery = supabase
                    .from('products')
                    .select('brand, price')
                    .limit(1000); // hard limit safe

                if (category && category !== 'ALL') facetQuery = facetQuery.eq('category', category);
                if (searchQuery) {
                    const q = `%${searchQuery}%`;
                    facetQuery = facetQuery.or(`name.ilike.${q},description.ilike.${q},brand.ilike.${q}`);
                }
                if (inSeason && culturesInSeason.length > 0) facetQuery = facetQuery.in('culture', culturesInSeason);

                const { data: facetData } = await facetQuery;

                if (isMounted && facetData) {
                    // Extrair marcas únicas
                    // Casting necessário para evitar erro de tipo 'never' se a inferência falhar
                    const typedFacetData = facetData as unknown as Array<{ brand: string | null; price: number }>;
                    const brands = Array.from(new Set(typedFacetData.map(p => p.brand).filter(Boolean) as string[])).sort();
                    setAvailableBrands(brands);
                }
            } catch (e) {
                console.error("Erro ao carregar facetas", e);
            }
        };

        void fetchProducts();
        fetchFacets(); // Dispara em paralelo; fetchProducts trata timeout/erro

        return () => { isMounted = false; };
    }, [page, pageSize, category, searchQuery, sortBy, JSON.stringify(selectedBrands), inStock, culture, inSeason, JSON.stringify(culturesInSeason)]);

    return {
        products,
        isLoading,
        error,
        totalCount,
        hasMore: page * pageSize < totalCount,
        availableBrands
    };
};

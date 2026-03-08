import { Product, ProductCategory } from '@/types';
import { ProductRow } from '@/types/database';

/**
 * Converte uma linha da tabela 'products' do Supabase para o tipo 'Product' do frontend.
 */
export const mapProductRowToProduct = (row: ProductRow): Product => {
    return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        technicalSpecs: row.technical_specs || '',
        price: Number(row.price),
        category: (row.category as ProductCategory) || ProductCategory.TOOLS,
        imageUrl: row.image_url || '',
        gallery: Array.isArray(row.gallery) ? row.gallery.map(String) : [],
        stock: row.stock || 0,
        rating: Number(row.rating) || 0,
        reviewCount: row.review_count || 0,
        oldPrice: row.old_price ? Number(row.old_price) : undefined,
        discount: row.discount || undefined,
        isNew: row.is_new || false,
        isBestSeller: row.is_best_seller || false,
        brand: row.brand || undefined,
        weight: row.weight ? Number(row.weight) : undefined,
        width: row.width ? Number(row.width) : undefined,
        height: row.height ? Number(row.height) : undefined,
        length: row.length ? Number(row.length) : undefined,
        wholesaleMinAmount: row.wholesale_min_amount ? Number(row.wholesale_min_amount) : undefined,
        wholesaleDiscountPercent: row.wholesale_discount_percent ? Number(row.wholesale_discount_percent) : undefined,
        culture: (row as { culture?: string }).culture || undefined
    };
};

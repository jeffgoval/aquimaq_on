/**
 * Tipos para queries Supabase (API/Admin).
 * Usado para eliminar `any` e tipar corretamente as respostas.
 */

/** Linha da tabela orders (Supabase) para Admin */
export interface OrderRow {
  id: string;
  cliente_id: string;
  subtotal: number;
  shipping_cost: number;
  shipping_method: string | null;
  total: number;
  status: string;
  created_at: string;
  payment_method: string | null;
  tracking_code: string | null;
  profiles?: { name?: string; phone?: string } | null;
}

/** Linha da tabela products (Supabase) para Admin */
export interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  technical_specs: string | null;
  price: number;
  category: string;
  image_url: string | null;
  gallery: string[] | null;
  stock: number;
  rating: number | null;
  review_count: number | null;
  is_new?: boolean;
  is_best_seller?: boolean;
  is_active?: boolean;
}


// -----------------------------------------------------------------------------
// ATENÇÃO: Este arquivo define manualmente os tipos do banco de dados.
// RECOMENDAÇÃO: Utilize a CLI do Supabase para gerar tipos automaticamente sempre que o banco mudar.
// Comando: supabase gen types typescript --project-id <SEU_PROJECT_ID> > src/types/supabase.ts
// E então atualize este arquivo ou aponte os imports para o novo arquivo gerado.
// -----------------------------------------------------------------------------

import type { CartItem } from '@/types';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  full_name: string | null;
  document_number: string | null;
  document_type: string | null;
  state_registration: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'cliente' | 'admin' | 'vendedor' | 'gerente';
  cep: string | null;
  address: string | null;
  address_number: string | null;
  address_complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  created_at?: string;
  updated_at?: string;
  cart_items?: CartItem[] | null;
}

export interface CropCalendarRow {
  id: string;
  culture: string;
  region: string | null;
  month_plant_start: number;
  month_plant_end: number;
  month_harvest_start: number;
  month_harvest_end: number;
  created_at?: string;
}

export interface WishlistRow {
  id: string;
  cliente_id: string;
  product_id: string;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  cliente_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  verified_purchase: boolean;
  profiles?: {
    name: string | null;
  };
}

export interface OrderRow {
  id: string;
  cliente_id: string | null;
  status: string;
  shipping_cost: number;
  subtotal: number;
  total: number;
  shipping_method: string | null;
  shipping_address: unknown;
  payment_method: string | null;
  payment_details: unknown;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ProductRow {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  old_price: number | null;
  discount: number | null;
  stock: number;
  technical_specs: string | null;
  category: string | null;
  image_url: string | null;
  gallery: any;
  is_active: boolean | null;
  is_new: boolean | null;
  is_best_seller: boolean | null;
  rating: number | null;
  review_count: number | null;
  weight: number | null;
  width: number | null;
  height: number | null;
  length: number | null;
  brand: string | null;
  wholesale_min_amount: number | null;
  wholesale_discount_percent: number | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      crop_calendar: {
        Row: CropCalendarRow;
        Insert: Omit<CropCalendarRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<CropCalendarRow, 'id'>>;
        Relationships: [];
      };
      wishlist: {
        Row: WishlistRow;
        Insert: Omit<WishlistRow, 'id' | 'created_at'>;
        Update: Partial<Omit<WishlistRow, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: "wishlist_cliente_id_fkey"
            columns: ["cliente_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ];
      };
      reviews: {
        Row: ReviewRow;
        Insert: Omit<ReviewRow, 'id' | 'created_at' | 'profiles'>;
        Update: Partial<Omit<ReviewRow, 'id' | 'created_at' | 'profiles'>>;
        Relationships: [
          {
            foreignKeyName: "reviews_cliente_id_fkey"
            columns: ["cliente_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ];
      };
      orders: {
        Row: OrderRow;
        Insert: Omit<OrderRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OrderRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [
          {
            foreignKeyName: "orders_cliente_id_fkey"
            columns: ["cliente_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ];
      };
      order_items: {
        Row: OrderItemRow;
        Insert: Omit<OrderItemRow, 'id'>;
        Update: Partial<Omit<OrderItemRow, 'id'>>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ];
      };
      products: {
        Row: ProductRow;
        Insert: Omit<ProductRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<ProductRow>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      create_order: {
        Args: {
          p_cliente_id: string;
          p_items: Json;
          p_shipping_cost: number;
          p_subtotal: number;
          p_total: number;
          p_shipping_method: string;
          p_shipping_address: Json;
          p_payment_method: string;
          p_payment_details: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}

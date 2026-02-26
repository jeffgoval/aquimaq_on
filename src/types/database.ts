// -----------------------------------------------------------------------------
// ATENÇÃO: Tipos simplificados para Catálogo Público.
// -----------------------------------------------------------------------------

import type { CartItem } from '@/types';

export type UserRole = 'cliente' | 'admin' | 'vendedor' | 'gerente';

export interface ProfileRow {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  created_at?: string;
  updated_at?: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'in_process' | 'cancelled';

export interface PaymentRow {
  id: string;
  order_id: string;
  external_id: string | null;
  status: PaymentStatus;
  amount: number | null;
  created_at: string;
  updated_at?: string;
}

export interface ChatConversationRow {
  id: string;
  customer_id: string;
  status: string;
  subject: string | null;
  assigned_agent: string | null;
  channel: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRow {
  id: string;
  conversation_id: string;
  sender_type: string;
  sender_id: string | null;
  content: string;
  created_at: string;
}

export interface AIKnowledgeBaseRow {
  id: string;
  source_type: string;
  source_id: string | null;
  title: string | null;
  content: string;
  chunk_index: number | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      crop_calendar: {
        Row: CropCalendarRow;
        Insert: any;
        Update: any;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: any;
        Update: any;
        Relationships: [];
      };
      ai_knowledge_base: {
        Row: AIKnowledgeBaseRow;
        Insert: any;
        Update: any;
        Relationships: [];
      };
      chat_conversations: {
        Row: ChatConversationRow;
        Insert: Omit<ChatConversationRow, 'id' | 'created_at' | 'updated_at'> & { id?: string, created_at?: string, updated_at?: string };
        Update: Partial<ChatConversationRow>;
        Relationships: [];
      };
      chat_messages: {
        Row: ChatMessageRow;
        Insert: Omit<ChatMessageRow, 'id' | 'created_at'> & { id?: string, created_at?: string };
        Update: Partial<ChatMessageRow>;
        Relationships: [];
      };
      payments: {
        Row: PaymentRow;
        Insert: any;
        Update: any;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, 'id'> & { id?: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      orders: {
        Row: any;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
    };
  };
  Views: {
    [key: string]: any;
  };
  Functions: {
    get_sales_summary: {
      Args: Record<string, any>;
      Returns: any;
    };
    get_daily_sales: {
      Args: Record<string, any>;
      Returns: any;
    };
    get_product_ranking: {
      Args: Record<string, any>;
      Returns: any;
    };
    update_user_role: {
      Args: Record<string, any>;
      Returns: any;
    };
    [key: string]: any;
  };
  Enums: {
    [key: string]: any;
  };
  CompositeTypes: {
    [key: string]: any;
  };
}

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
  culture: string | null;
  vendedor_id: string | null;
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
  customer_id: string | null;
  status: string;
  subject: string | null;
  assigned_agent: string | null;
  channel: string | null;
  contact_phone: string | null;
  current_queue_state: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRow {
  id: string;
  conversation_id: string;
  sender_type: string;
  sender_id: string | null;
  content: string;
  external_message_id: string | null;
  delivery_status: string;
  metadata: Json | null;
  created_at: string;
}

export interface ChatAssignmentEventRow {
  id: string;
  conversation_id: string;
  from_agent: string | null;
  to_agent: string | null;
  reason: string;
  created_at: string;
}

export interface WhatsAppSessionRow {
  id: string;
  phone: string;
  human_mode: boolean;
  conversation_id: string | null;
  assigned_agent: string | null;
  last_customer_message_at: string | null;
  unread_count: number;
  last_handoff_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  product_id: string;
  user_id: string | null;
  rating: number;
  comment: string | null;
  verified_purchase: boolean | null;
  created_at: string;
  updated_at: string | null;
}

export interface AISettingsRow {
  id: string;
  provider: string;
  api_key: string;
  model: string | null;
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
      ai_settings: {
        Row: AISettingsRow;
        Insert: any;
        Update: any;
        Relationships: [];
      };
      chat_conversations: {
        Row: ChatConversationRow;
        Insert: {
          id?: string;
          customer_id?: string | null;
          status?: string;
          subject?: string | null;
          assigned_agent?: string | null;
          channel?: string | null;
          contact_phone?: string | null;
          current_queue_state?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ChatConversationRow>;
        Relationships: [];
      };
      chat_messages: {
        Row: ChatMessageRow;
        Insert: {
          id?: string;
          conversation_id: string;
          sender_type: string;
          sender_id?: string | null;
          content: string;
          external_message_id?: string | null;
          delivery_status?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: Partial<ChatMessageRow>;
        Relationships: [];
      };
      chat_assignment_events: {
        Row: ChatAssignmentEventRow;
        Insert: Omit<ChatAssignmentEventRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<ChatAssignmentEventRow>;
        Relationships: [];
      };
      whatsapp_sessions: {
        Row: WhatsAppSessionRow;
        Insert: Omit<WhatsAppSessionRow, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<WhatsAppSessionRow>;
        Relationships: [];
      };
      reviews: {
        Row: ReviewRow;
        Insert: Omit<ReviewRow, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string | null };
        Update: Partial<ReviewRow>;
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

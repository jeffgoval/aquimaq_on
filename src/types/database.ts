// Gerado automaticamente via Supabase MCP — não editar manualmente.
// Para regenerar: supabase gen types typescript --project-id bzicdqrbqykypzesxayw

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_knowledge_base: {
        Row: {
          content: string
          created_at: string | null
          embedding: string
          id: string
          metadata: Json | null
          product_document_id: string
          product_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding: string
          id?: string
          metadata?: Json | null
          product_document_id: string
          product_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string
          id?: string
          metadata?: Json | null
          product_document_id?: string
          product_id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          color_gradient: string | null
          created_at: string
          cta: string | null
          cta_link: string | null
          cta_text: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          position: number | null
          starts_at: string | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          color_gradient?: string | null
          created_at?: string
          cta?: string | null
          cta_link?: string | null
          cta_text?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          position?: number | null
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          color_gradient?: string | null
          created_at?: string
          cta?: string | null
          cta_link?: string | null
          cta_text?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          position?: number | null
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crop_calendar: {
        Row: {
          created_at: string
          culture: string
          id: string
          month_harvest_end: number
          month_harvest_start: number
          month_plant_end: number
          month_plant_start: number
          region: string | null
        }
        Insert: {
          created_at?: string
          culture: string
          id?: string
          month_harvest_end: number
          month_harvest_start: number
          month_plant_end: number
          month_plant_start: number
          region?: string | null
        }
        Update: {
          created_at?: string
          culture?: string
          id?: string
          month_harvest_end?: number
          month_harvest_start?: number
          month_plant_end?: number
          month_plant_start?: number
          region?: string | null
        }
        Relationships: []
      }
      n8n_webhook_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          processed_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          status?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          id: string
          slug: string
          name: string
          body: string
          meta_status: string
          meta_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          body: string
          meta_status?: string
          meta_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          body?: string
          meta_status?: string
          meta_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string | null
          quantity: number
          total_price: number | null
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name?: string | null
          quantity: number
          total_price?: number | null
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cliente_id: string | null
          created_at: string
          id: string
          me_order_id: string | null
          notes: string | null
          payment_details: Json | null
          payment_method: string | null
          shipping_address: Json | null
          shipping_cost: number
          shipping_method: string | null
          shipping_status: string | null
          status: Database["public"]["Enums"]["order_status"]
          stock_decremented: boolean
          stock_restored: boolean
          subtotal: number
          total: number
          tracking_code: string | null
          tracking_url: string | null
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          me_order_id?: string | null
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          shipping_address?: Json | null
          shipping_cost?: number
          shipping_method?: string | null
          shipping_status?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stock_decremented?: boolean
          stock_restored?: boolean
          subtotal?: number
          total?: number
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          me_order_id?: string | null
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          shipping_address?: Json | null
          shipping_cost?: number
          shipping_method?: string | null
          shipping_status?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stock_decremented?: boolean
          stock_restored?: boolean
          subtotal?: number
          total?: number
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          boleto_url: string | null
          created_at: string
          currency: string | null
          external_id: string | null
          external_reference: string | null
          id: string
          installments: number | null
          mp_checkout_url: string | null
          mp_preference_id: string | null
          order_id: string
          paid_at: string | null
          payer_document: string | null
          payer_email: string | null
          payment_type: string | null
          pix_qr_code: string | null
          pix_qr_code_base64: string | null
          raw_webhook: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          status_detail: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          boleto_url?: string | null
          created_at?: string
          currency?: string | null
          external_id?: string | null
          external_reference?: string | null
          id?: string
          installments?: number | null
          mp_checkout_url?: string | null
          mp_preference_id?: string | null
          order_id: string
          paid_at?: string | null
          payer_document?: string | null
          payer_email?: string | null
          payment_type?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          raw_webhook?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          status_detail?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          boleto_url?: string | null
          created_at?: string
          currency?: string | null
          external_id?: string | null
          external_reference?: string | null
          id?: string
          installments?: number | null
          mp_checkout_url?: string | null
          mp_preference_id?: string | null
          order_id?: string
          paid_at?: string | null
          payer_document?: string | null
          payer_email?: string | null
          payment_type?: string | null
          pix_qr_code?: string | null
          pix_qr_code_base64?: string | null
          raw_webhook?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          status_detail?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          processed: boolean
          product_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          processed?: boolean
          product_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          processed?: boolean
          product_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          batch_number: string | null
          brand: string | null
          category: string | null
          created_at: string
          culture: string | null
          description: string | null
          discount: number | null
          expiry_date: string | null
          gallery: Json | null
          height: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_best_seller: boolean | null
          is_new: boolean | null
          length: number | null
          name: string
          old_price: number | null
          price: number | null
          rating: number | null
          reorder_point: number | null
          review_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          stock: number | null
          supplier: string | null
          technical_specs: string | null
          updated_at: string
          vendedor_id: string | null
          warehouse_location: string | null
          weight: number | null
          wholesale_discount_percent: number | null
          wholesale_min_amount: number | null
          width: number | null
        }
        Insert: {
          batch_number?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string
          culture?: string | null
          description?: string | null
          discount?: number | null
          expiry_date?: string | null
          gallery?: Json | null
          height?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_best_seller?: boolean | null
          is_new?: boolean | null
          length?: number | null
          name: string
          old_price?: number | null
          price?: number | null
          rating?: number | null
          reorder_point?: number | null
          review_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          stock?: number | null
          supplier?: string | null
          technical_specs?: string | null
          updated_at?: string
          vendedor_id?: string | null
          warehouse_location?: string | null
          weight?: number | null
          wholesale_discount_percent?: number | null
          wholesale_min_amount?: number | null
          width?: number | null
        }
        Update: {
          batch_number?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string
          culture?: string | null
          description?: string | null
          discount?: number | null
          expiry_date?: string | null
          gallery?: Json | null
          height?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_best_seller?: boolean | null
          is_new?: boolean | null
          length?: number | null
          name?: string
          old_price?: number | null
          price?: number | null
          rating?: number | null
          reorder_point?: number | null
          review_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          stock?: number | null
          supplier?: string | null
          technical_specs?: string | null
          updated_at?: string
          vendedor_id?: string | null
          warehouse_location?: string | null
          weight?: number | null
          wholesale_discount_percent?: number | null
          wholesale_min_amount?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          address_complement: string | null
          address_number: string | null
          avatar_url: string | null
          cart_items: Json | null
          cep: string | null
          city: string | null
          complement: string | null
          created_at: string
          document_number: string | null
          document_type: string | null
          email: string | null
          id: string
          name: string | null
          neighborhood: string | null
          number: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          state: string | null
          state_registration: string | null
          street: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          avatar_url?: string | null
          cart_items?: Json | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          id: string
          name?: string | null
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          state_registration?: string | null
          street?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          avatar_url?: string | null
          cart_items?: Json | null
          cep?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          id?: string
          name?: string | null
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          state_registration?: string | null
          street?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          cliente_id: string
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          verified_purchase: boolean | null
        }
        Insert: {
          cliente_id: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          verified_purchase?: boolean | null
        }
        Update: {
          cliente_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_quotes: {
        Row: {
          created_at: string
          destination_cep: string | null
          expires_at: string | null
          id: string
          me_label_url: string | null
          me_shipment_id: string | null
          order_id: string | null
          origin_cep: string | null
          packages: Json | null
          quotes: Json | null
          selected_price: number | null
          selected_service: string | null
          tracking_code: string | null
        }
        Insert: {
          created_at?: string
          destination_cep?: string | null
          expires_at?: string | null
          id?: string
          me_label_url?: string | null
          me_shipment_id?: string | null
          order_id?: string | null
          origin_cep?: string | null
          packages?: Json | null
          quotes?: Json | null
          selected_price?: number | null
          selected_service?: string | null
          tracking_code?: string | null
        }
        Update: {
          created_at?: string
          destination_cep?: string | null
          expires_at?: string | null
          id?: string
          me_label_url?: string | null
          me_shipment_id?: string | null
          order_id?: string | null
          origin_cep?: string | null
          packages?: Json | null
          quotes?: Json | null
          selected_price?: number | null
          selected_service?: string | null
          tracking_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_quotes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_notifications: {
        Row: {
          created_at: string
          email: string
          id: string
          notified_at: string | null
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          accepted_payment_types: Json
          ai_config: Json | null
          banner_slide_interval_ms: number
          banner_url: string | null
          cnpj: string | null
          created_at: string
          cross_sell_category: string | null
          cross_sell_enabled: boolean | null
          description: string | null
          email: string | null
          free_shipping_threshold: number | null
          id: string
          logo_url: string | null
          max_installments: number
          navigation_menu: Json | null
          opening_hours: string | null
          origin_cep: string | null
          origin_city: string | null
          origin_complement: string | null
          origin_district: string | null
          origin_number: string | null
          origin_state: string | null
          origin_street: string | null
          phone: string | null
          razao_social: string | null
          reclame_aqui_url: string | null
          seasonal_context: string | null
          shipping_restriction_message: string | null
          shipping_rules: Json | null
          social_media: Json | null
          store_name: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          accepted_payment_types?: Json
          ai_config?: Json | null
          banner_slide_interval_ms?: number
          banner_url?: string | null
          cnpj?: string | null
          created_at?: string
          cross_sell_category?: string | null
          cross_sell_enabled?: boolean | null
          description?: string | null
          email?: string | null
          free_shipping_threshold?: number | null
          id?: string
          logo_url?: string | null
          max_installments?: number
          navigation_menu?: Json | null
          opening_hours?: string | null
          origin_cep?: string | null
          origin_city?: string | null
          origin_complement?: string | null
          origin_district?: string | null
          origin_number?: string | null
          origin_state?: string | null
          origin_street?: string | null
          phone?: string | null
          razao_social?: string | null
          reclame_aqui_url?: string | null
          seasonal_context?: string | null
          shipping_restriction_message?: string | null
          shipping_rules?: Json | null
          social_media?: Json | null
          store_name?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          accepted_payment_types?: Json
          ai_config?: Json | null
          banner_slide_interval_ms?: number
          banner_url?: string | null
          cnpj?: string | null
          created_at?: string
          cross_sell_category?: string | null
          cross_sell_enabled?: boolean | null
          description?: string | null
          email?: string | null
          free_shipping_threshold?: number | null
          id?: string
          logo_url?: string | null
          max_installments?: number
          navigation_menu?: Json | null
          opening_hours?: string | null
          origin_cep?: string | null
          origin_city?: string | null
          origin_complement?: string | null
          origin_district?: string | null
          origin_number?: string | null
          origin_state?: string | null
          origin_street?: string | null
          phone?: string | null
          razao_social?: string | null
          reclame_aqui_url?: string | null
          seasonal_context?: string | null
          shipping_restriction_message?: string | null
          shipping_rules?: Json | null
          social_media?: Json | null
          store_name?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          cliente_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_expired_orders: { Args: never; Returns: undefined }
      check_document_exists: {
        Args: { p_drive_file_id: string }
        Returns: Json
      }
      create_order: {
        Args: {
          p_cliente_id: string
          p_items: Json
          p_payment_details: Json
          p_payment_method: string
          p_shipping_address: Json
          p_shipping_cost: number
          p_shipping_method: string
          p_subtotal: number
          p_total: number
        }
        Returns: Json
      }
      decrement_stock_for_order: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      get_daily_sales: {
        Args: { p_period_days?: number }
        Returns: {
          orders_count: number
          revenue: number
          sale_date: string
        }[]
      }
      get_product_ranking: {
        Args: { p_max_results?: number }
        Returns: {
          product_id: string
          product_name: string
          units_sold: number
        }[]
      }
      get_sales_summary: { Args: { p_period_days?: number }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_manager: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      match_knowledge: {
        Args: {
          filter_product_id?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          product_document_id: string
          product_id: string
          similarity: number
        }[]
      }
      match_knowledge_base: {
        Args: {
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          content: string
          id: string
          product_id: string
          similarity: number
          title: string
        }[]
      }
      match_product_documents: {
        Args: {
          match_count?: number
          match_product_id: string
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          content: string
          id: string
          similarity: number
          title: string
        }[]
      }
      next_vendedor_for_handoff: {
        Args: { last_agent_id?: string }
        Returns: string
      }
      rag_search: {
        Args: {
          filter_tipo?: string
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          chunk_id: string
          conteudo: string
          document_id: string
          metadata: Json
          nome_documento: string
          similarity: number
          tipo_documento: string
        }[]
      }
      restore_stock_from_unpaid_orders: { Args: never; Returns: number }
    }
    Enums: {
      chat_channel: "web" | "whatsapp"
      chat_delivery_status: "pending" | "sent" | "delivered" | "failed"
      chat_queue_state: "new" | "bot" | "waiting_human" | "assigned" | "closed"
      chat_status: "active" | "waiting_human" | "closed"
      message_sender: "customer" | "ai_agent" | "human_agent"
      order_status:
        | "draft"
        | "aguardando_pagamento"
        | "pago"
        | "em_separacao"
        | "enviado"
        | "pronto_retirada"
        | "entregue"
        | "cancelado"
      payment_status:
        | "pending"
        | "approved"
        | "rejected"
        | "refunded"
        | "cancelled"
        | "in_process"
        | "charged_back"
      user_role: "cliente" | "admin" | "vendedor" | "gerente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      chat_channel: ["web", "whatsapp"],
      chat_delivery_status: ["pending", "sent", "delivered", "failed"],
      chat_queue_state: ["new", "bot", "waiting_human", "assigned", "closed"],
      chat_status: ["active", "waiting_human", "closed"],
      message_sender: ["customer", "ai_agent", "human_agent"],
      order_status: [
        "draft",
        "aguardando_pagamento",
        "pago",
        "em_separacao",
        "enviado",
        "pronto_retirada",
        "entregue",
        "cancelado",
      ],
      payment_status: [
        "pending",
        "approved",
        "rejected",
        "refunded",
        "cancelled",
        "in_process",
        "charged_back",
      ],
      user_role: ["cliente", "admin", "vendedor", "gerente"],
    },
  },
} as const

// ── Aliases de conveniência (manter compatibilidade com imports existentes) ──
export type ProductRow = Tables<'products'>
export type ProfileRow = Tables<'profiles'>
export type CropCalendarRow = Tables<'crop_calendar'>
export type PaymentRow = Tables<'payments'>
export type ReviewRow = Tables<'reviews'>
export type UserRole = Enums<'user_role'>
export type PaymentStatus = Enums<'payment_status'>

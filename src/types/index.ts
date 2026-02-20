// Enumerações de Domínio conforme PRD
export enum OrderStatus {
  DRAFT = 'draft',
  WAITING_PAYMENT = 'aguardando_pagamento',
  PAID = 'pago',
  PICKING = 'em_separacao',
  SHIPPED = 'enviado',
  READY_PICKUP = 'pronto_retirada',
  DELIVERED = 'entregue',
  CANCELLED = 'cancelado',
}


export enum ProductCategory {
  TOOLS = 'Ferramentas Manuais',
  PARTS = 'Peças de Reposição',
  ACCESSORIES = 'Acessórios',
  SEEDS = 'Sementes Fracionadas',
  SHELF = 'Itens de Prateleira',
  // New Categories from Mega Menu
  NUTRITION = 'Nutrição Animal',
  DEFENSIVES = 'Defensivos Agrícolas',
  PPE = 'EPI e Segurança',
  EQUIPMENT = 'Equipamentos',
}

// Entidades
export interface Product {
  id: string;
  name: string;
  description: string;
  technicalSpecs: string; // Base de conhecimento para IA
  price: number;
  category: ProductCategory;
  imageUrl: string;
  gallery?: string[]; // Array de imagens adicionais para detalhes
  stock: number;
  rating: number; // 0 a 5
  reviewCount: number;
  oldPrice?: number;
  discount?: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  wholesaleMinAmount?: number;
  wholesaleDiscountPercent?: number;
  /** Dimensões para cálculo de frete: peso (kg), largura/altura/comprimento (cm) */
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
  brand?: string;
  /** Cultura associada (ex.: Soja, Milho) para filtro e recomendações */
  culture?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Cliente {
  id: string;
  name: string;
  phone: string; // Chave primária para WhatsApp
  document: string; // CPF ou CNPJ
  stateRegistration?: string; // Inscrição Estadual
  email?: string;
  avatar_url?: string;
  role?: 'cliente' | 'admin' | 'vendedor' | 'gerente';

  // Endereço Único
  address?: {
    zip: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
  };
}

export interface ShippingOption {
  id: string;
  carrier: string; // 'Correios', 'Jadlog', 'Transportadora Regional'
  service: string; // 'SEDEX', 'PAC', 'Expresso'
  price: number;
  estimatedDays: number;
}

/** Resultado do cálculo de frete; pode incluir mensagem de erro quando o cálculo falha */
export interface ShippingResult {
  options: ShippingOption[];
  error?: string;
}

export interface Order {
  id: string;
  clientId: string;
  items: Array<{
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
  }>;
  subtotal: number;
  shippingCost: number;
  shippingMethod?: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  paymentMethod?: string;
  trackingCode?: string;
}

// Navigation Types
export type ViewState = 'LOGIN' | 'CATALOG' | 'PRODUCT_DETAIL' | 'CART' | 'ORDERS' | 'ORDER_DETAIL' | 'CHECKOUT_PAYMENT' | 'PROFILE' | 'STORE_SETTINGS' | 'USER_MANAGEMENT' | 'ADMIN_DASHBOARD' | 'ADMIN_ORDERS' | 'ADMIN_PRODUCTS' | 'ADMIN_BANNERS' | 'ADMIN_AI_SETTINGS' | 'ADMIN_KNOWLEDGE';
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
  NUTRITION = 'Nutrição Animal',
  DEFENSIVES = 'Defensivos Agrícolas',
  PPE = 'EPI e Segurança',
  EQUIPMENT = 'Equipamentos',
  // Mega Menu v2
  MACHINES = 'Máquinas e Equipamentos',
  INPUTS = 'Insumos Agrícolas',
  HARVEST = 'Colheita e Ferramentas',
  PET = 'Linha Pet',
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
  /** Gestão de estoque agrícola */
  expiryDate?: string;
  batchNumber?: string;
  warehouseLocation?: string;
  reorderPoint?: number;
  supplier?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ShippingOption {
  id: string;
  carrier: string; // 'Correios', 'Jadlog', 'Transportadora Regional'
  service: string; // 'SEDEX', 'PAC', 'Expresso'
  price: number;
  estimatedDays: number;
}

/** Resultado do cálculo de frete */
export interface ShippingResult {
  options: ShippingOption[];
  error?: string;
  /** true quando a transportadora não atende o CEP informado */
  cepNotServiced?: boolean;
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

// Pagamento
export type PaymentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'refunded'
  | 'cancelled'
  | 'in_process'
  | 'charged_back';

// Navigation Types (Simplified for Catalog Only)
export type ViewState = 'CATALOG' | 'PRODUCT_DETAIL' | 'CART' | 'WISHLIST';

/**
 * Camada de serviços (Service Layer).
 * Encapsula o acesso ao Supabase; componentes e hooks consomem estes serviços
 * em vez de chamar o Supabase diretamente.
 */

export * from './productService';
export * from './bannerService';
export * from './storeSettingsService';
export * from './reviewService';
export * from './adminService';
export * from './paymentService';
export * from './chatService';
export * from './knowledgeBaseService';

export { supabase, isSupabaseConfigured } from './supabase';

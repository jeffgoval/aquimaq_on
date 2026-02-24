import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(20),
  VITE_MERCADO_PAGO_PUBLIC_KEY: z.string().min(10).optional().catch('APP_USR-00000000-0000-0000-0000-000000000000'),
});

export const ENV = envSchema.parse(import.meta.env);

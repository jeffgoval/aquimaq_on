import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  if (import.meta.env.DEV) {
    console.warn(
      '[Supabase] VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão definidos. Defina-as no .env para conectar ao Supabase. O app carregará, mas as chamadas de dados falharão.'
    );
  }
}

const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient<Database>(url, key);

export const isSupabaseConfigured = isConfigured;

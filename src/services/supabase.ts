import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

console.log('--- DEBUG SUPABASE ENV ---');
console.log('URL:', supabaseUrl);
console.log('KEY (primeiros 10 chars):', supabaseAnonKey ? supabaseAnonKey.substring(0, 10) : 'undefined');
console.log('MODE:', import.meta.env.MODE);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Falha crítica: Variáveis de ambiente do Supabase não encontradas.');
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios no .env');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

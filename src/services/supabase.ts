import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { ENV } from '@/config/env';

export const supabase = createClient<Database>(
  ENV.VITE_SUPABASE_URL,
  ENV.VITE_SUPABASE_ANON_KEY
);

export const isSupabaseConfigured = true;

import { supabase } from './supabase';
import type { ProfileRow } from '@/types/database';

/** Perfil por ID. */
export const getProfile = async (
  clientId: string
): Promise<ProfileRow | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error || !data) return null;
  return data as ProfileRow;
};

/** Garante que o perfil existe; cria com role cliente se não existir. */
export const ensureProfile = async (
  clientId: string,
  email: string | undefined
): Promise<ProfileRow | null> => {
  const existing = await getProfile(clientId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: clientId,
        email: email ?? null,
        role: 'cliente',
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error || !data) return null;
  return data as ProfileRow;
};

/** Atualiza perfil por ID. */
export const updateProfile = async (
  clientId: string,
  payload: Partial<ProfileRow>
): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update(payload as Record<string, unknown>)
    .eq('id', clientId);
  if (error) throw error;
};

/** Lista nomes/telefones de perfis por IDs (admin). */
export const getProfilesByIds = async (
  ids: string[]
): Promise<Array<{ id: string; name: string | null }>> => {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', ids);
  if (error) return [];
  return (data as Array<{ id: string; name: string | null }>) ?? [];
};

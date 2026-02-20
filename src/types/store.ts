/**
 * Tipos da loja: frontend (camelCase) e banco (snake_case).
 * O adapter mapeia entre os dois para evitar quebrar a UI ao conectar ao Supabase.
 */

export interface StoreSettingsAddress {
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  zip: string;
}

export interface StoreSettingsSocialMedia {
  instagram: string;
  facebook: string;
  youtube: string;
}

/** Formato usado na UI (camelCase) */
export interface StoreSettings {
  storeName: string;
  description: string;
  cnpj: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: StoreSettingsAddress;
  openingHours: string;
  socialMedia: StoreSettingsSocialMedia;
  logoUrl?: string;
  bannerUrl?: string;
}

/** Formato da tabela store_settings no Supabase (snake_case). Endereço de origem apenas em origin_* (Melhor Envios / Mercado Pago). */
export interface StoreSettingsDB {
  id?: string;
  store_name: string;
  description: string;
  document: string;
  email: string;
  phone: string;
  whatsapp: string;
  opening_hours: string;
  social_media: StoreSettingsSocialMedia;
  logo_url?: string | null;
  banner_url?: string | null;
  origin_cep?: string | null;
  origin_street?: string | null;
  origin_number?: string | null;
  origin_complement?: string | null;
  origin_district?: string | null;
  origin_city?: string | null;
  origin_state?: string | null;
  created_at?: string;
  updated_at?: string;
}

const defaultAddress: StoreSettingsAddress = {
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  zip: '',
};

const defaultSocial: StoreSettingsSocialMedia = {
  instagram: '',
  facebook: '',
  youtube: '',
};

/** Converte linha do banco (snake_case) para formato do frontend (camelCase). Endereço vem das colunas origin_*. */
export const storeSettingsFromDB = (row: StoreSettingsDB | null): StoreSettings | null => {
  if (!row) return null;

  const r = row as StoreSettingsDB;
  const address: StoreSettingsAddress =
    r.origin_cep != null || r.origin_street != null || r.origin_city != null
      ? {
          zip: r.origin_cep ?? '',
          street: r.origin_street ?? '',
          number: r.origin_number ?? '',
          complement: r.origin_complement ?? '',
          district: r.origin_district ?? '',
          city: r.origin_city ?? '',
          state: r.origin_state ?? '',
        }
      : defaultAddress;

  return {
    storeName: r.store_name ?? (r as Record<string, unknown>).name ?? '',
    description: r.description ?? '',
    cnpj: r.document ?? (r as Record<string, unknown>).cnpj ?? '',
    email: r.email ?? '',
    phone: r.phone ?? '',
    whatsapp: r.whatsapp ?? '',
    address,
    openingHours: r.opening_hours ?? '',
    socialMedia: r.social_media ?? defaultSocial,
    logoUrl: r.logo_url ?? undefined,
    bannerUrl: r.banner_url ?? undefined,
  };
};

/** Converte payload do frontend (camelCase) para update no banco (snake_case). Preenche origin_* a partir de address. */
export const storeSettingsToDB = (
  s: Partial<StoreSettings>
): Partial<StoreSettingsDB> => {
  const out: Partial<StoreSettingsDB> = {};
  if (s.storeName !== undefined) out.store_name = s.storeName;
  if (s.description !== undefined) out.description = s.description;
  if (s.cnpj !== undefined) out.document = s.cnpj;
  if (s.email !== undefined) out.email = s.email;
  if (s.phone !== undefined) out.phone = s.phone;
  if (s.whatsapp !== undefined) out.whatsapp = s.whatsapp;
  if (s.address !== undefined) {
    out.origin_cep = s.address.zip?.replace(/\D/g, '') ?? null;
    out.origin_street = s.address.street ?? null;
    out.origin_number = s.address.number ?? null;
    out.origin_complement = s.address.complement ?? null;
    out.origin_district = s.address.district ?? null;
    out.origin_city = s.address.city ?? null;
    out.origin_state = s.address.state ?? null;
  }
  if (s.openingHours !== undefined) out.opening_hours = s.openingHours;
  if (s.socialMedia !== undefined) out.social_media = s.socialMedia;
  if (s.logoUrl !== undefined) out.logo_url = s.logoUrl ?? null;
  if (s.bannerUrl !== undefined) out.banner_url = s.bannerUrl ?? null;
  return out;
};

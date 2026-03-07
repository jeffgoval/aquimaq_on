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
  razaoSocial: string;
  description: string;
  cnpj: string;
  email: string;
  phone: string;
  address: StoreSettingsAddress;
  openingHours: string;
  socialMedia: StoreSettingsSocialMedia;
  logoUrl?: string;
  bannerUrl?: string;
  maxInstallments: number;
  acceptedPaymentTypes: string[];
  bannerSlideIntervalMs?: number;
  reclameAquiUrl: string;
}

/** Formato da tabela store_settings no Supabase (snake_case). Endereço de origem apenas em origin_* (Melhor Envios / Mercado Pago). */
export interface StoreSettingsDB {
  id?: string;
  store_name: string;
  razao_social?: string | null;
  description: string;
  document?: string; // legado; o banco usa cnpj
  cnpj?: string;
  email: string;
  phone: string;
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
  max_installments?: number | null;
  accepted_payment_types?: string[] | null;
  banner_slide_interval_ms?: number | null;
  reclame_aqui_url?: string | null;
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
    storeName: r.store_name ?? '',
    razaoSocial: r.razao_social ?? '',
    description: r.description ?? '',
    cnpj: r.cnpj ?? r.document ?? '',
    email: r.email ?? '',
    phone: r.phone ?? '',
    address,
    openingHours: r.opening_hours ?? '',
    socialMedia: r.social_media ?? defaultSocial,
    logoUrl: r.logo_url ?? undefined,
    bannerUrl: r.banner_url ?? undefined,
    maxInstallments: r.max_installments ?? 12,
    acceptedPaymentTypes: r.accepted_payment_types ?? ['credit_card', 'debit_card', 'bank_transfer', 'ticket'],
    bannerSlideIntervalMs: r.banner_slide_interval_ms ?? 5000,
    reclameAquiUrl: r.reclame_aqui_url ?? '',
  };
};

/** Converte payload do frontend (camelCase) para update no banco (snake_case). Preenche origin_* a partir de address. */
export const storeSettingsToDB = (
  s: Partial<StoreSettings>
): Partial<StoreSettingsDB> => {
  const out: Partial<StoreSettingsDB> = {};
  if (s.storeName !== undefined) out.store_name = s.storeName;
  if (s.razaoSocial !== undefined) out.razao_social = s.razaoSocial || null;
  if (s.description !== undefined) out.description = s.description;
  if (s.cnpj !== undefined) out.cnpj = s.cnpj;
  if (s.email !== undefined) out.email = s.email;
  if (s.phone !== undefined) out.phone = s.phone;
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
  if (s.maxInstallments !== undefined) out.max_installments = s.maxInstallments;
  if (s.acceptedPaymentTypes !== undefined) out.accepted_payment_types = s.acceptedPaymentTypes;
  if (s.bannerSlideIntervalMs !== undefined) out.banner_slide_interval_ms = s.bannerSlideIntervalMs;
  if (s.reclameAquiUrl !== undefined) out.reclame_aqui_url = s.reclameAquiUrl || null;
  return out;
};

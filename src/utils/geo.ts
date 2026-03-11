export interface Coordinates {
  lat: number;
  lng: number;
}

/** Distância em km entre dois pontos (fórmula de Haversine). */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Cache por sessão para evitar múltiplas chamadas ao mesmo CEP. */
const _cache = new Map<string, Coordinates | null>();

/**
 * Busca coordenadas de um CEP via BrasilAPI (sem autenticação).
 * Retorna null se o CEP não tiver coordenadas (zona rural sem ponto exato).
 */
export async function fetchCepCoordinates(cep: string): Promise<Coordinates | null> {
  const clean = cep.replace(/\D/g, '');
  if (_cache.has(clean)) return _cache.get(clean)!;

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${clean}`);
    if (!res.ok) {
      _cache.set(clean, null);
      return null;
    }
    const data = await res.json();
    const { longitude, latitude } = data?.location?.coordinates ?? {};
    if (longitude == null || latitude == null) {
      _cache.set(clean, null);
      return null;
    }
    const coords: Coordinates = { lat: Number(latitude), lng: Number(longitude) };
    _cache.set(clean, coords);
    return coords;
  } catch {
    _cache.set(clean, null);
    return null;
  }
}

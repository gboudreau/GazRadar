const API_URL = 'https://regieessencequebec.ca/stations.geojson.gz';
const CACHE_KEY_STATIONS = 'gazradar_stations';
const CACHE_KEY_META = 'gazradar_fetch_meta';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

export function normalizeStation(feature) {
  const p = feature.properties ?? {};
  const [lng, lat] = feature.geometry.coordinates;

  // API returns Prices as an array: [{GasType, Price, IsAvailable}, ...]
  const prices = {};
  for (const item of (p.Prices ?? [])) {
    prices[item.GasType] = (item.IsAvailable && item.Price)
      ? parseFloat(String(item.Price).replace('¢', ''))
      : null;
  }

  return {
    id: String(feature.id ?? p.id ?? crypto.randomUUID()),
    name: p.Name ?? 'Inconnu',
    brand: (p.brand === 'Aucun' || !p.brand) ? 'Inconnu' : p.brand,
    lat,
    lng,
    address: p.Address ?? '',
    prices,
  };
}

export async function loadStations({ force = false } = {}) {
  if (!force) {
    const meta = JSON.parse(localStorage.getItem(CACHE_KEY_META) ?? 'null');
    if (meta && Date.now() - meta.lastFetchedAt < CACHE_TTL_MS) {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY_STATIONS) ?? 'null');
      if (cached?.length) {
        return { stations: cached, generatedAt: meta.generatedAt, lastFetchedAt: meta.lastFetchedAt };
      }
    }
  }

  const response = await fetch(API_URL);
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  const geojson = await response.json();

  const stations = geojson.features
    .filter(f => f.geometry?.coordinates)
    .map(normalizeStation);
  const generatedAt = geojson.metadata?.generated_at ?? null;
  const lastFetchedAt = Date.now();

  try {
    localStorage.setItem(CACHE_KEY_STATIONS, JSON.stringify(stations));
    localStorage.setItem(CACHE_KEY_META, JSON.stringify({ generatedAt, lastFetchedAt }));
  } catch {
    // localStorage quota exceeded — proceed without caching
  }

  return { stations, generatedAt, lastFetchedAt };
}

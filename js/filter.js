import { haversine } from './geo.js';

export function filterAndSort(stations, prefs, userLocation) {
  const { selectedBrands, selectedGasTypes, maxDistanceKm, sortBy } = prefs;

  const withDist = stations.map(s => ({
    ...s,
    distanceKm: userLocation
      ? haversine(userLocation, { lat: s.lat, lng: s.lng })
      : Infinity,
  }));

  const withinRange = withDist.filter(s => s.distanceKm <= maxDistanceKm);

  const hasType = withinRange.filter(s =>
    selectedGasTypes.some(t => s.prices[t] != null)
  );

  const brandExcludedCount = selectedBrands.length > 0
    ? hasType.filter(s => !selectedBrands.includes(s.brand)).length
    : 0;

  const afterBrand = selectedBrands.length > 0
    ? hasType.filter(s => selectedBrands.includes(s.brand))
    : hasType;

  const effectivePrice = s => {
    const prices = selectedGasTypes
      .map(t => s.prices[t])
      .filter(p => p != null);
    return prices.length ? Math.min(...prices) : Infinity;
  };

  const sorted = [...afterBrand].sort((a, b) =>
    sortBy === 'price'
      ? effectivePrice(a) - effectivePrice(b)
      : a.distanceKm - b.distanceKm
  );

  const minPrice = sorted.reduce((min, s) => {
    const p = effectivePrice(s);
    return p < min ? p : min;
  }, Infinity);

  const results = sorted.map(s => {
    const ep = effectivePrice(s);
    return {
      ...s,
      effectivePrice: ep,
      isBestDeal: ep === minPrice && minPrice !== Infinity,
    };
  });

  return { results, brandExcludedCount };
}

const EARTH_RADIUS_KM = 6371;

export function haversine(a, b) {
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const x = sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(x));
}

export async function geocode(query) {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '6');
    url.searchParams.set('countrycodes', 'ca');
    url.searchParams.set('addressdetails', '1');
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'fr', 'User-Agent': 'GazRadar/1.0' },
    });
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    return data.map(item => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      label: _shortLabel(item),
    }));
  } catch (err) {
    console.warn('Geocoding failed:', err);
    return [];
  }
}

function _shortLabel(item) {
  const a = item.address ?? {};
  const place = a.city || a.town || a.village || a.municipality || a.hamlet || '';
  const region = a.state || a.province || '';
  const road = a.road ? `${a.house_number ? a.house_number + ' ' : ''}${a.road}` : '';
  const parts = [road, place, region].filter(Boolean);
  return parts.length ? parts.join(', ') : item.display_name;
}

export function getLocation({ maximumAge = 300000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: false, timeout: 50000, maximumAge }
    );
  });
}

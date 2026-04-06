import { store } from './store.js';
import { getLocation } from './geo.js';
import { loadStations } from './data.js';
import { filterAndSort } from './filter.js';
import './components/app-header.js';
import './components/location-bar.js';
import './components/location-picker.js';
import './components/quick-filters.js';
import './components/filter-sheet.js';
import './components/station-list.js';
import './components/station-card.js';
import './components/empty-state.js';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.warn);
}

// Screen Wake Lock — keep screen on while the app is visible
let _wakeLock = null;
async function acquireWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    _wakeLock = await navigator.wakeLock.request('screen');
  } catch {
    // Permission denied or not supported — fail silently
  }
}
acquireWakeLock();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') acquireWakeLock();
});

const fab = document.createElement('button');
fab.className = 'filter-fab';
fab.innerHTML = '🏷 Bannières';
fab.addEventListener('click', () => store.set('filterSheetOpen', true));
document.body.appendChild(fab);

let savedPrefs = null;
try {
  savedPrefs = JSON.parse(localStorage.getItem('gazradar_prefs') ?? 'null');
} catch (e) {
  console.warn('Failed to parse saved preferences, using defaults', e);
}
if (savedPrefs) store.set('prefs', { ...store.get('prefs'), ...savedPrefs });

let savedMeta = null;
try {
  savedMeta = JSON.parse(localStorage.getItem('gazradar_fetch_meta') ?? 'null');
} catch (e) {
  console.warn('Failed to parse fetch meta, using defaults', e);
}
if (savedMeta) {
  store.set('generatedAt', savedMeta.generatedAt);
  store.set('lastFetchedAt', savedMeta.lastFetchedAt);
}

let savedCustomLocation = null;
try {
  savedCustomLocation = JSON.parse(localStorage.getItem('gazradar_custom_location') ?? 'null');
} catch (e) {
  console.warn('Failed to parse custom location, using defaults', e);
}
if (savedCustomLocation) store.set('customLocation', savedCustomLocation);

store.subscribe('customLocation', loc => {
  if (loc) localStorage.setItem('gazradar_custom_location', JSON.stringify(loc));
  else localStorage.removeItem('gazradar_custom_location');
});

const firstLaunchDone = localStorage.getItem('gazradar_first_launch_done');
if (firstLaunchDone) store.set('isFirstLaunch', false);

function runFilter() {
  const stations        = store.get('stations');
  const prefs           = store.get('prefs');
  const customLocation  = store.get('customLocation');
  const userLocation    = store.get('userLocation');
  const effectiveLoc    = customLocation ?? userLocation;
  if (!stations.length) return;
  const { results, brandExcludedCount } = filterAndSort(stations, prefs, effectiveLoc);
  store.set('filteredStations', results);
  store.set('brandExcludedCount', brandExcludedCount);
}

store.subscribe('stations', runFilter);
store.subscribe('prefs', runFilter);
store.subscribe('userLocation', loc => {
  if (loc) store.set('userLocationUpdatedAt', Date.now());
  runFilter();
});
store.subscribe('customLocation', runFilter);

document.addEventListener('gazradar:refresh', () => {
  loadAndSetStations(true);
  if (!store.get('customLocation') && store.get('locationStatus') === 'granted') {
    getLocation({ maximumAge: 0 }).then(loc => store.set('userLocation', loc)).catch(() => {});
  }
});
document.addEventListener('gazradar:retry-location', initLocation);

async function loadAndSetStations(force = false) {
  store.set('dataStatus', 'loading');
  try {
    const { stations, generatedAt, lastFetchedAt } = await loadStations({ force });

    const allBrands = [...new Set(stations.map(s => s.brand).filter(Boolean))].sort();
    const allTypes  = [...new Set(stations.flatMap(s => Object.keys(s.prices)))].sort();

    store.set('stations', stations);
    store.set('availableBrands', allBrands);
    store.set('availableGasTypes', allTypes);
    store.set('generatedAt', generatedAt);
    store.set('lastFetchedAt', lastFetchedAt);
    store.set('dataStatus', 'ready');
  } catch (err) {
    console.error('Failed to load stations:', err);
    store.set('dataStatus', 'error');
  }
}

let _locationRefreshInterval = null;

async function initLocation() {
  store.set('locationStatus', 'pending');
  try {
    const loc = await getLocation();
    store.set('userLocation', loc);
    store.set('locationStatus', 'granted');
    startLocationRefresh();
  } catch {
    store.set('locationStatus', 'denied');
  }
}

function startLocationRefresh() {
  if (_locationRefreshInterval) return; // already running
  _locationRefreshInterval = setInterval(async () => {
    if (document.visibilityState !== 'visible') return;
    if (store.get('locationStatus') !== 'granted') return;
    try {
      const loc = await getLocation({ maximumAge: 0 });
      store.set('userLocation', loc);
    } catch {
      // silently keep the last known location
    }
  }, 60_000);
}

(async () => {
  if (store.get('isFirstLaunch')) store.set('filterSheetOpen', true);

  await Promise.all([initLocation(), loadAndSetStations()]);
})();

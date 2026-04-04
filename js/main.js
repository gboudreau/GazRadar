import { store } from './store.js';
import { getLocation } from './geo.js';
import { loadStations } from './data.js';
import { filterAndSort } from './filter.js';
import './components/app-header.js';
import './components/filter-sheet.js';
import './components/station-list.js';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.warn);
}

const fab = document.createElement('button');
fab.className = 'filter-fab';
fab.innerHTML = '⚙ Filtres';
fab.addEventListener('click', () => store.set('filterSheetOpen', true));
document.body.appendChild(fab);

const savedPrefs = JSON.parse(localStorage.getItem('gazradar_prefs') ?? 'null');
if (savedPrefs) store.set('prefs', { ...store.get('prefs'), ...savedPrefs });

const savedMeta = JSON.parse(localStorage.getItem('gazradar_fetch_meta') ?? 'null');
if (savedMeta) {
  store.set('generatedAt', savedMeta.generatedAt);
  store.set('lastFetchedAt', savedMeta.lastFetchedAt);
}

const firstLaunchDone = localStorage.getItem('gazradar_first_launch_done');
if (firstLaunchDone) store.set('isFirstLaunch', false);

function runFilter() {
  const stations     = store.get('stations');
  const prefs        = store.get('prefs');
  const userLocation = store.get('userLocation');
  if (!stations.length) return;
  const { results, brandExcludedCount } = filterAndSort(stations, prefs, userLocation);
  store.set('filteredStations', results);
  store.set('brandExcludedCount', brandExcludedCount);
}

store.subscribe('stations', runFilter);
store.subscribe('prefs', runFilter);
store.subscribe('userLocation', runFilter);

document.addEventListener('gazradar:refresh', () => loadAndSetStations(true));
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

async function initLocation() {
  store.set('locationStatus', 'pending');
  try {
    const loc = await getLocation();
    store.set('userLocation', loc);
    store.set('locationStatus', 'granted');
  } catch {
    store.set('locationStatus', 'denied');
  }
}

(async () => {
  if (store.get('isFirstLaunch')) store.set('filterSheetOpen', true);

  await Promise.all([initLocation(), loadAndSetStations()]);
})();

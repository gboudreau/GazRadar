const APP_SHELL_CACHE = 'app-shell-v2';
const DATA_CACHE = 'data-v1';
const DATA_URL = 'https://regieessencequebec.ca/stations.geojson.gz';

const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/css/app.css',
  '/manifest.json',
  '/js/main.js',
  '/js/store.js',
  '/js/data.js',
  '/js/geo.js',
  '/js/filter.js',
  '/js/brands.js',
  '/js/components/app-header.js',
  '/js/components/location-bar.js',
  '/js/components/location-picker.js',
  '/js/components/quick-filters.js',
  '/js/components/filter-sheet.js',
  '/js/components/station-list.js',
  '/js/components/station-card.js',
  '/js/components/empty-state.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then(cache =>
      Promise.all(
        APP_SHELL_FILES.map(url =>
          fetch(url, { cache: 'reload' })
            .then(res => { if (res.ok) cache.put(url, res); })
            .catch(() => {}) // non-critical assets (icons) can fail silently
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== APP_SHELL_CACHE && k !== DATA_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // For app shell assets, use cache-first with network update in background
  if (url.origin === self.location.origin && !url.href.endsWith(DATA_URL)) {
    event.respondWith(
      caches.match(request).then(response => {
        // Always fetch and update cache in background
        const fetchAndCache = fetch(request).then(networkResponse => {
          caches.open(APP_SHELL_CACHE).then(cache => cache.put(request, networkResponse.clone()));
          return networkResponse;
        });
        return response || fetchAndCache;
      })
    );
    return;
  }

  // For data URL, use stale-while-revalidate
  if (url.href === DATA_URL) {
    event.respondWith(
      caches.open(DATA_CACHE).then(cache => {
        return fetch(event.request).then(response => {
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => {
          // Return stale cache if network fails
          return cache.match(event.request);
        });
      })
    );
    return;
  }
});

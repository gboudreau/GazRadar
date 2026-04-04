const APP_SHELL_CACHE = 'app-shell-v1';
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
  '/js/components/filter-sheet.js',
  '/js/components/station-list.js',
  '/js/components/station-card.js',
  '/js/components/empty-state.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL_FILES))
      .then(() => self.skipWaiting())
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

  if (request.url === DATA_URL) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DATA_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request)
        .then(cached => cached ?? fetch(request))
    );
  }
});

const CACHE_NAME = 'vigorix-v3';
const urlsToCache = [
  './',
  './index.html',
  './historico.html',
  './login.html',
  './manifest.json',
  './css/style.css',
  './css/animations.css',
  './js/data.js',
  './js/utils.js',
  './js/app.js',
  './js/timer.js',
  './js/history.js',
  './js/supabase-config.js',
  './js/supabase-client.js',
  './js/auth.js',
  './js/api.js',
  './js/sync.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

const CACHE_NAME = 'vigorix-v6';

const PRECACHE = [
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
  './js/sync.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

// Network-first: no GitHub Pages o cache-first entregava JS antigo depois de cada deploy.
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copia = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copia));
        }
        return response;
      })
      .catch(() => caches.match(request).then(resposta => {
        if (resposta) return resposta;
        if (request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      }))
  );
});

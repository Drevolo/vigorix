const CACHE_NAME = 'vigorix-v7';

const PRECACHE = [
  './',
  './index.html',
  './historico.html',
  './login.html',
  './manifest.json',

  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './css/pages/home.css',
  './css/pages/history.css',
  './css/pages/login.css',
  './css/animations.css',

  './js/core/config.js',
  './js/core/supabase-client.js',
  './js/core/utils.js',
  './js/core/data.js',
  './js/core/auth.js',
  './js/core/api.js',
  './js/core/sync.js',
  './js/core/history.js',
  './js/core/pwa.js',

  './js/workout/state.js',
  './js/workout/stats.js',
  './js/workout/actions.js',

  './js/ui/dom.js',
  './js/ui/workout-view.js',
  './js/ui/dashboard-view.js',
  './js/ui/edit-modal.js',
  './js/ui/sidebar.js',

  './js/pages/home.js',
  './js/pages/history.js',
  './js/pages/login.js',

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

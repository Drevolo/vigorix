// Registro do service worker (PWA + cache offline).
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').catch(console.error);
}

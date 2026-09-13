const CACHE_NAME = 'chemodanchik-shell-v2';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for the app shell: всегда пытаемся взять свежую версию с сервера,
// и только если сети нет (офлайн) — отдаём последнюю сохранённую копию из кэша.
// Так обновления index.html на GitHub видны сразу же, а офлайн-режим не теряется.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isShellRequest = url.origin === self.location.origin;
  if (!isShellRequest || event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(()=>{});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

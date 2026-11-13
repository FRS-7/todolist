// Service Worker — Catatan Aktivitas Harian
const CACHE_NAME = 'aktivitas-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './supabase.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: cache semua asset
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback ke cache
self.addEventListener('fetch', event => {
  // Hanya cache GET request untuk asset lokal
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('supabase.co')) return; // jangan cache API call

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Notifikasi klik
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

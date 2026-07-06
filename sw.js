// ============================================
// SERVICE WORKER
// ============================================
// !!! ÖNEMLİ: Bu dosyayı kendi repo adına göre
// güncellemene gerek yok, otomatik algılar.
// ============================================

// Repo yolunu otomatik bul (örn: /-bu-kalp-senden)
const BASE_PATH = self.location.pathname.replace(/\/sw\.js.*$/, '') || '';
const CACHE_NAME = 'pwa-cache-v1';

const ASSETS = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/manifest.json',
  BASE_PATH + '/css/style.css',
  BASE_PATH + '/js/config.js',
  BASE_PATH + '/js/app.js',
  BASE_PATH + '/js/blockblast.js',
  BASE_PATH + '/js/widgets/login.js',
  BASE_PATH + '/js/widgets/counter.js',
  BASE_PATH + '/js/widgets/kalbim.js',
  BASE_PATH + '/js/widgets/mascot.js',
  BASE_PATH + '/js/widgets/locket.js',
  BASE_PATH + '/js/widgets/anilar.js',
  BASE_PATH + '/js/widgets/profil.js',
  BASE_PATH + '/data/kalbim.json',
  BASE_PATH + '/data/memories.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => cached))
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = BASE_PATH + '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(BASE_PATH + '/') && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
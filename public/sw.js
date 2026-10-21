self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // سرویس‌ورکر حداقلی جهت تایید معیار PWA در مرورگر
});
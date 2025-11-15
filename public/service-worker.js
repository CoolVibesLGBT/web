const CACHE_NAME = 'coolvibes-cache-v20';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/icon_16x16.png',
  '/icons/icon_16x16@2x.png',
  '/icons/icon_32x32.png',
  '/icons/icon_32x32@2x.png',
  '/icons/icon_128x128.png',
  '/icons/icon_128x128@2x.png',
  '/icons/icon_256x256.png',
  '/icons/icon_256x256@2x.png',
  '/icons/icon_512x512.png',
  '/icons/icon_512x512@2x.png'
];

// CACHE'LERİ DEVRE DIŞI BIRAKILMIŞ SERVICE WORKER

self.addEventListener('install', (event) => {
  // Cache yapma
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Tüm eski cache'leri temizle (önceki versiyonlardan kalanları da siler)
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  
  if (event.request.method !== 'GET') return;

  // VITE HMR protection
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/@vite') || url.pathname.includes('hmr')) return;

  // WebSocket protection
  if (event.request.url.startsWith('ws://') || event.request.url.startsWith('wss://')) return;

  // Chrome extension protection
  if (event.request.url.startsWith('chrome-extension://')) return;

  // Socket.io protection
  if (event.request.url.includes('socket.io')) return;

  // Direkt network’e git, cache’e bakma, cache’e yazma
  event.respondWith(fetch(event.request).catch(() => {
    // offline'da fallback İSTERSEN buraya eklenir
    // return new Response("Offline");
  }));
});
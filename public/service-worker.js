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


self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  let received = event.data.json()

  console.log("Received,",received)

  const title = `CoolVibes LGBTIQA+ ${received.title}`;
  const options = {
    body: received.body,
      data: {
      url: 'https://coolvibes.lgbt' || '/' // tıklanınca açılacak URL
    }
  };


  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', event => {
  event.notification.close();

  // Tıklayınca açılacak URL'yi options.data'dan alıyoruz
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Halihazırda açık olan pencereler içinde url kontrolü yap
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Açık pencere yoksa yeni sekme aç
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
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


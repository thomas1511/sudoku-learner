// Lightweight service worker: network-first for navigations (so updates always
// arrive when online) with a cached fallback for offline use, and stale-while-
// revalidate for same-origin static assets. Content-hashed Vite assets make
// cached entries safe to keep indefinitely.
const CACHE = 'sudoku-lab-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Navigations: try the network, fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          return (await caches.match(request)) || (await caches.match('./')) || Response.error();
        }
      })(),
    );
    return;
  }

  // Static assets: serve from cache, refresh in the background.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      const network = fetch(request)
        .then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })(),
  );
});

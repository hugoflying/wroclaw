// Service worker — Wrocław PWA
const CACHE = 'wroclaw-v1';
const ASSETS = [
  './',
  './wroclaw-app.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Ressources externes (fond de carte, tuiles OSM, météo, CDN Leaflet) :
  // réseau d'abord, puis cache si hors-ligne.
  if (url.origin !== location.origin) {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return r;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Ressources locales (l'appli) : cache d'abord, puis réseau.
  e.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return r;
      })
    )
  );
});

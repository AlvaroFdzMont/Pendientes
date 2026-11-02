// Funciona sin conexión: sirve la app desde la caché y la actualiza por detrás.
// Si cambias un archivo y quieres forzar la actualización, sube el número de versión.
const CACHE = 'pendientes-v7';
// Tipografía y motor del reconocimiento de voz (de otros servidores): se guardan la primera vez
const EXT = 'pendientes-externos';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'stt-worker.js',
  'manifest.webmanifest',
  'manifest-dark.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];
const EXT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  // Solo se borran las cachés antiguas de la propia app: el modelo de voz (transformers-cache) se conserva
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith('pendientes-') && k !== CACHE && k !== EXT)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (EXT_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => {
      const cache = await caches.open(EXT);
      const cached = await cache.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  if (url.origin !== location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = req.mode === 'navigate' ? 'index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    const network = fetch(req)
      .then((res) => {
        if (res.ok) return cache.put(key, res.clone()).then(() => res);
        return res;
      })
      .catch(() => cached);
    e.waitUntil(network.catch(() => {}));
    return cached || network;
  })());
});

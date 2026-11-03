// Funciona sin conexión. Con internet se usa siempre la versión más nueva de la app (así las actualizaciones y los
// colores al instalar llegan a la primera); sin conexión, o si la red tarda, la copia guardada.
// Si cambias un archivo y quieres forzar la actualización, sube el número de versión.
const CACHE = 'pendientes-v9';
// Tipografía y motor del reconocimiento de voz (de otros servidores): se guardan la primera vez
const EXT = 'pendientes-externos';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'stt-worker.js',
  'manifest.webmanifest',
  'manifest-light.webmanifest',
  'manifest-dark.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];
const EXT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];
const NET_WAIT = 4000; // ms que se espera a la red antes de tirar de la copia guardada

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

  const key = req.mode === 'navigate' ? 'index.html' : req;
  const network = fetch(req, { cache: 'no-cache' });
  // La copia guardada se renueva con lo que llegue de la red, aunque llegue tarde
  e.waitUntil(network.then(async (res) => {
    if (res.ok) await (await caches.open(CACHE)).put(key, res.clone());
  }).catch(() => {}));

  e.respondWith((async () => {
    const timeout = new Promise((resolve) => setTimeout(resolve, NET_WAIT));
    try {
      const res = await Promise.race([network, timeout]);
      if (res) return res.clone();
    } catch { /* sin conexión */ }
    const cached = await (await caches.open(CACHE)).match(key, { ignoreSearch: true });
    return cached || network.then((r) => r.clone());
  })());
});

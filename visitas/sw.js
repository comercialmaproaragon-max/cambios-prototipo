const CACHE = 'visitas-mapro-v1';
const PRECARGA = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'
];
const DOMINIOS_CACHEABLES = ['cdn.sheetjs.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // si algún recurso externo falla, no abortamos la instalación
      Promise.allSettled(PRECARGA.map(u => c.add(u)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(enCache =>
      enCache ||
      fetch(e.request).then(resp => {
        const propia = e.request.url.startsWith(self.location.origin);
        const externa = DOMINIOS_CACHEABLES.some(d => e.request.url.includes(d));
        if (resp.ok && (propia || externa)) {
          const copia = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
        }
        return resp;
      }).catch(() => enCache)
    )
  );
});

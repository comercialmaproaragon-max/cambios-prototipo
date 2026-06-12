const CACHE = 'cambios-prototipo-v6';
const PRECARGA = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './datos-pedidos.enc',
  'https://unpkg.com/docx@8.5.0/build/index.umd.js',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap'
];
const DOMINIOS_CACHEABLES = ['unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECARGA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Los datos de pedidos van por red primero para recoger actualizaciones; si no hay conexión, caché
  if (e.request.url.includes('datos-pedidos.enc')) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
        }
        return resp;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
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
      })
    )
  );
});

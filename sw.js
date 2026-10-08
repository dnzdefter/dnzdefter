// DNZ Defter — minimal service worker.
// Amaç: tarayıcının siteyi yüklenebilir bir PWA olarak tanıması (manifest + fetch olayı).
// GÜVENLİK: Yalnızca bu sitenin KENDİ dosyaları (aynı kaynak) önbelleğe alınır. Supabase / hesap verisi
// gibi başka alan adlarına giden istekler asla önbelleğe yazılmaz ve buradan geçirilmez; böylece çıkış
// yaptıktan sonra cihazda önbellekte kalan müşteri/fatura verisi olmaz.
const CACHE_NAME = 'dnz-defter-v2';

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // başka alan adı (Supabase vb.): hiç dokunma
  if (url.searchParams.has('takip')) return;                // müşteri takip bağlantıları önbelleğe alınmaz
  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(req))
  );
});

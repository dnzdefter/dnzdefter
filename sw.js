// DNZ Defter — minimal service worker.
// Bu dosyanın TEK amacı, tarayıcının (Android/Chrome) siteyi gerçek bir "yüklenebilir" PWA olarak
// tanımasını sağlamak — manifest.json tek başına yeterli değil, bir service worker + fetch olayı da
// gerekiyor. Bu olmadan "Ana Ekrana Ekle" sadece bir kısayol/yer imi oluşturuyor ve geri tuşu
// tarayıcının kendi kontrolünde kalıyor (uygulama içi geçmişe devredilmiyor).
const CACHE_NAME = 'dnz-defter-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Basit "önce ağ, olmazsa önbellek" stratejisi — asıl amaç çevrimdışı çalışmak değil (uygulama
// zaten Supabase'e bağlı çalışıyor), sadece tarayıcının PWA kurulabilirlik kriterini karşılamak.
// Başarılı bir GET isteği önbelleğe de yazılır; ağ erişilemezse (kısa bir kesinti anında) en son
// başarılı yanıt döner.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

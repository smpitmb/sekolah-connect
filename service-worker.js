/* ====================================================================
   SERVICE WORKER - SekolahConnect
   Mengaktifkan caching dasar agar aplikasi:
   - Bisa diinstal sebagai PWA di HP
   - Tetap bisa dibuka (shell aplikasi) walau koneksi internet putus
   Catatan: data real-time (post, chat, dll) tetap butuh internet
   karena disimpan di Firebase, hanya tampilan/shell yang di-cache.
==================================================================== */

const CACHE_NAME = 'sekolahconnect-v1';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png'
];

// Install: simpan file inti ke cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: bersihkan cache versi lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: strategi "network first, fallback ke cache"
// Cocok untuk app yang datanya real-time (Firebase) tapi shell-nya tetap harus muncul saat offline
self.addEventListener('fetch', event => {
  // Jangan cache request ke Firebase/API eksternal - biarkan langsung ke network
  if (
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('gstatic.com') ||
    event.request.method !== 'GET'
  ) {
    return; // biarkan request berjalan normal tanpa intervensi service worker
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Simpan salinan terbaru ke cache
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // Offline: ambil dari cache
        return caches.match(event.request).then(cached => {
          return cached || caches.match('./index.html');
        });
      })
  );
});

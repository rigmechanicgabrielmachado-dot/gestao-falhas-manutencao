const CACHE_NAME = 'manutencao-v2'; // Incrementámos a versão para forçar atualização

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o novo Service Worker a ativar-se imediatamente
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // Apaga qualquer cache antiga guardada no telemóvel
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma o controlo imediato de todas as abas abertas
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Estratégia "Network First": tenta ir buscar sempre a versão mais recente à internet (Vercel).
  // Só usa a cache se estiver completamente sem internet (offline).
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

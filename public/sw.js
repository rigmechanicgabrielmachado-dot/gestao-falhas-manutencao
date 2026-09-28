self.addEventListener('install', (event) => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
  });
  
  self.addEventListener('fetch', (event) => {
    // Passa todas as requisições normalmente pela rede
    event.respondWith(fetch(event.request));
  });
  
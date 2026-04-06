// Service Worker para cache de imagens e assets estáticos
const CACHE_NAME = 'aquila-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Continuar mesmo se alguns assets falharem
        console.log('Alguns assets não puderam ser cacheados');
      });
    })
  );
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Apenas cache para GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Cache-first strategy para imagens
  if (IMAGE_EXTENSIONS.some((ext) => url.pathname.endsWith(ext))) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }

          return fetch(request).then((response) => {
            // Não cachear respostas não-sucesso
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clonar a resposta
            const responseToCache = response.clone();
            cache.put(request, responseToCache);
            return response;
          });
        });
      })
    );
    return;
  }

  // Network-first strategy para HTML e JS
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request).then((response) => {
          return response || new Response('Offline', { status: 503 });
        });
      })
  );
});

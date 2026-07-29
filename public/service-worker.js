const CACHE_NAME = "chamaja-cache-v3";
const ASSETS_TO_CACHE = [
  "/app",
  "/app/",
  "/app/index.html",
  "/manifest.json",
  "/icon-512.png",
  // O Expo gera bundles JS/CSS que mudarão de nome (hashes).
  // Portanto, usaremos uma estratégia Network First para navegação
  // e Cache First para assets conhecidos e imagens.
];

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Fazendo cache dos assets básicos");
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn(
          "[Service Worker] Falha ao fazer cache de alguns assets iniciais",
          err,
        );
      });
    }),
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log(
                "[Service Worker] Removendo cache antigo:",
                cacheName,
              );
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Estratégia de Fetch
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Ignora requisições de outras origens ou requisições de API/Supabase/tRPC
  if (
    requestUrl.origin !== location.origin ||
    requestUrl.pathname.startsWith("/api") ||
    requestUrl.pathname.startsWith("/trpc") ||
    requestUrl.hostname.includes("supabase")
  ) {
    return;
  }

  // Estratégia Stale-While-Revalidate para a maioria dos recursos
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Apenas faz o cache de respostas válidas (status 200) e do tipo básico
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Se a rede falhar e for uma navegação (html), tentamos retornar o index.html do app offline
          if (event.request.mode === "navigate") {
            return caches.match("/app/index.html");
          }
        });

      return cachedResponse || fetchPromise;
    }),
  );
});

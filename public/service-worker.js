// ─────────────────────────────────────────────────────────────────────────────
// XamaJá Service Worker — v4
//
// REGRAS FUNDAMENTAIS (especialmente para Safari/iOS):
//   1. NUNCA retornar uma resposta redirecionada ao browser (response.redirected)
//   2. Navegação HTML → Network First (nunca Cache First)
//   3. Assets estáticos com hash → Cache First (imutáveis, seguros)
//   4. API / OAuth / cross-origin → pass-through (sem intercepção)
//   5. Registrar o SW sempre com scope: "/app/" para não interceptar "/"
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = "v4";
const CACHE_NAME = `chamaja-${CACHE_VERSION}`;

// Apenas assets verdadeiramente estáticos e imutáveis (sem URLs de página)
const PRECACHE_ASSETS = [
  "/icon-512.png",
  "/favicon.png",
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  // Ativa imediatamente sem esperar clientes antigos fecharem
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, { redirect: "error" }) // "error" → falha se houver redirect
            .then((response) => {
              if (response.ok && response.status === 200 && !response.redirected) {
                return cache.put(url, response);
              }
            })
            .catch(() => {
              // Silencia falhas de precache — não impede o SW de instalar
            }),
        ),
      );
    }),
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log("[SW] Removendo cache obsoleto:", name);
              return caches.delete(name);
            }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Verifica se a resposta é segura para armazenar no cache.
 * Jamais armazenar respostas com redirect — isso causa o erro no Safari.
 */
function isCacheableResponse(response) {
  return (
    response &&
    response.ok &&
    response.status === 200 &&
    response.type === "basic" && // Apenas same-origin
    !response.redirected       // NUNCA cachear respostas redirecionadas
  );
}

/**
 * Verifica se a URL deve ser completamente ignorada pelo SW (pass-through).
 */
function shouldPassThrough(url) {
  const { pathname, hostname, origin } = url;

  // Requisições cross-origin
  if (origin !== self.location.origin) return true;

  // APIs e autenticação — nunca interceptar
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/trpc/") ||
    pathname.startsWith("/oauth/") ||
    pathname.startsWith("/parceiros/auth-callback")
  ) return true;

  // Supabase ou qualquer subdomínio externo
  if (hostname.includes("supabase")) return true;

  return false;
}

/**
 * Verifica se o asset é estático imutável (possui hash no nome).
 * Esses arquivos são seguros para Cache First.
 */
function isImmutableAsset(url) {
  const { pathname } = url;

  // Expo gera bundles com hash: _expo/static/js/.../entry-abc123.js
  if (pathname.startsWith("/app/_expo/static/")) return true;

  // CSS e JS com hash explícito no nome
  if (/\.[a-f0-9]{8,}\.(js|css)$/.test(pathname)) return true;

  return false;
}

/**
 * Verifica se a requisição é de imagem ou ícone (Stale-While-Revalidate).
 */
function isImageAsset(url) {
  return /\.(png|jpg|jpeg|webp|gif|svg|ico|avif)$/i.test(url.pathname);
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Ignora métodos que não sejam GET
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Pass-through para APIs, OAuth e cross-origin
  if (shouldPassThrough(url)) return;

  // ── Estratégia 1: NETWORK FIRST para navegação HTML ──────────────────────
  // Safari exige que páginas nunca venham do cache sem tentativa de rede primeiro.
  // Isso evita servir redirects cacheados.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // ── Estratégia 2: CACHE FIRST para assets imutáveis com hash ─────────────
  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ── Estratégia 3: STALE-WHILE-REVALIDATE para imagens/ícones ─────────────
  if (isImageAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // ── Estratégia 4: NETWORK FIRST para todo o restante ─────────────────────
  event.respondWith(networkFirst(request));
});

// ── Estratégias de Cache ──────────────────────────────────────────────────────

/**
 * Network First: tenta rede primeiro, usa cache como fallback offline.
 * Nunca retorna redirects ao browser.
 */
async function networkFirst(request) {
  try {
    // Usa redirect: "manual" para detectar redirects antes de retorná-los
    const networkResponse = await fetch(request, { redirect: "manual" });

    // Se a resposta for um redirect (3xx), NÃO a retornar ao browser diretamente.
    // Em vez disso, seguimos o redirect normalmente e retornamos a resposta final.
    if (
      networkResponse.type === "opaqueredirect" ||
      (networkResponse.status >= 300 && networkResponse.status < 400)
    ) {
      // Faz um fetch normal (sem manual) para seguir o redirect
      const followedResponse = await fetch(request);

      // Armazena no cache apenas se for resposta válida e sem redirect
      if (isCacheableResponse(followedResponse)) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, followedResponse.clone());
      }

      return followedResponse;
    }

    // Resposta normal — armazenar no cache se for cacheável
    if (isCacheableResponse(networkResponse)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Rede falhou — tentar cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback offline para navegação
    if (request.mode === "navigate") {
      const offlineFallback = await caches.match("/app/index.html");
      if (offlineFallback) return offlineFallback;
    }

    // Sem cache disponível — retorna erro genérico offline
    return new Response("Sem conexão. Verifique sua internet.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

/**
 * Cache First: usa cache, atualiza em background. Ideal para assets com hash.
 * Verifica se a resposta é válida antes de armazenar.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request, { redirect: "error" });

    if (isCacheableResponse(networkResponse)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    return new Response("Asset não disponível offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

/**
 * Stale-While-Revalidate: serve cache imediatamente, atualiza em background.
 * Nunca armazena redirects.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkFetch = fetch(request, { redirect: "error" })
    .then((networkResponse) => {
      if (isCacheableResponse(networkResponse)) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  return cached || (await networkFetch) || new Response("", { status: 503 });
}

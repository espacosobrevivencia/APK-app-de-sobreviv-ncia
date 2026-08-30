const CACHE_PREFIX = "sobrevivencia-offline-v";
const CACHE_NAME = "sobrevivencia-central-v4.0.0";

// Somente o shell da PWA entra no cache. Arquivos escolhidos pelo usuário
// na Biblioteca Offline (fotos, vídeos, PDFs etc.) NUNCA entram aqui.
const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icone.png"
];

const ESSENTIAL_FILES = [
  "./index.html",
  "./manifest.json",
  "./icone.png"
];

const INDEX_URL = new URL("./index.html", self.location).href;

const APP_SHELL_URLS = new Set([
  new URL("./", self.location).href,
  new URL("./index.html", self.location).href,
  new URL("./manifest.json", self.location).href,
  new URL("./icone.png", self.location).href
]);

const CORE_URLS = new Set(FILES.map(file => new URL(file, self.location).href));

async function verifyCurrentCache() {
  const cache = await caches.open(CACHE_NAME);
  for (const file of ESSENTIAL_FILES) {
    const url = new URL(file, self.location).href;
    if (!(await cache.match(url))) return false;
  }
  return true;
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(FILES);

      const complete = await verifyCurrentCache();
      if (!complete) throw new Error("Cache novo incompleto.");

      // Não chama skipWaiting automaticamente. A versão antiga continua ativa
      // até o app confirmar que a nova foi instalada e o usuário aceitar atualizar.
    } catch (error) {
      // Se a instalação nova falhar, não deixa um cache V3.3 parcial ocupando o lugar.
      await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const complete = await verifyCurrentCache();
    if (!complete) throw new Error("Cache atual incompleto; ativação cancelada.");

    // Só depois de confirmar que a nova versão está completa removemos caches antigos.
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegação: ONLINE = busca o index atual no servidor.
  // OFFLINE = usa a última cópia válida.
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const fresh = await fetch(request, { cache: "no-store" });

        if (fresh && fresh.ok) {
          await cache.put(INDEX_URL, fresh.clone());
          return fresh;
        }
      } catch {}

      const cached =
        await cache.match(INDEX_URL) ||
        await caches.match("./index.html") ||
        await caches.match("./");

      if (cached) return cached;

      return new Response("Aplicativo indisponível offline.", {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    })());

    return;
  }

  // Arquivos da própria PWA: online tenta atualizar; offline usa cache.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    try {
      const fresh = await fetch(request, { cache: "no-store" });

      if (fresh && fresh.ok) {
        // Só recursos do mesmo domínio e do shell entram no cache.
        if (APP_SHELL_URLS.has(url.href)) {
          await cache.put(request, fresh.clone());
        }

        return fresh;
      }
    } catch {}

    const cached = await caches.match(request);
    if (cached) return cached;

    return new Response("Offline", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  })());
});

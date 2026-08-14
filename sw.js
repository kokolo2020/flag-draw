const CACHE = "flag-draw-v8";
const APP_SHELL = "/index.html?app-shell=v8";
const CORE_ASSETS = [APP_SHELL, "/manifest.json", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png"];

function freshRequest(request) {
  return new Request(request, { cache: "reload" });
}

function cacheAppShell(response) {
  if (!response || !response.ok) return response;
  const copy = response.clone();
  caches.open(CACHE).then((cache) => cache.put(APP_SHELL, copy));
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(CORE_ASSETS.map((asset) => cache.add(asset).catch(() => null)))
      )
  );
  self.skipWaiting();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(freshRequest(event.request))
        .then(cacheAppShell)
        .catch(() => caches.match(APP_SHELL).then((cached) => cached || Response.error()))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

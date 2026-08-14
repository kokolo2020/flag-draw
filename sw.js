const CACHE_PREFIX = "flag-draw-";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    if (self.caches && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX))
          .map((key) => caches.delete(key))
      );
    }

    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: "window" });
    await Promise.all(
      clients.map((client) => {
        if ("navigate" in client && client.url) {
          return client.navigate(client.url).catch(() => {});
        }
        return Promise.resolve();
      })
    );
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

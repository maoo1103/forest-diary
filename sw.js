/* 林间日记 Service Worker — 首次打开后即可完全离线使用 */
const CACHE = "forest-diary-v1";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const refresh = fetch(e.request)
        .then((res) => {
          const ok = res && (res.ok || res.type === "opaque");
          const cacheable =
            e.request.url.startsWith(self.location.origin) ||
            e.request.url.includes("fonts.googleapis.com") ||
            e.request.url.includes("fonts.gstatic.com");
          if (ok && cacheable) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => hit);
      return hit || refresh;
    })
  );
});

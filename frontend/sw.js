/* 智研 AI 法律系統 — Service Worker */
const CACHE = "zhiyan-v1";
const STATIC = [
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((hit) => {
      return hit || fetch(e.request).catch(() => new Response("離線模式", { status: 503 }));
    })
  );
});

const CACHE = "zhiyan-v2-1783168122";
const SHELL = [
  '/',
  '/contact',
  '/portfolio',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// 安裝：預先快取殼層
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return c.addAll(SHELL).catch(err => {
        console.warn('[SW] 部分資源預載失敗（非靜態殼層的正常行為）:', err);
      });
    })
  );
});

// 啟動：清理舊快取 + 立即接管
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// 請求攔截：殼層用 Cache-First，其餘 Network-First
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // 只攔截同源請求
  if (url.origin !== self.location.origin) return;

  // 殼層資源 → Cache-First
  if (SHELL.includes(url.pathname)) {
    e.respondWith(staleWhileRevalidate(e.request));
    return;
  }

  // 靜態資源（_ds/ 設計系統） → Cache-First
  if (url.pathname.startsWith('/_ds/')) {
    e.respondWith(cacheFirst(e.request));
    return;
  }

  // 其餘 → Network-First
  e.respondWith(networkFirst(e.request));
});

// ── 快取策略 ──

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then(res => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fetchPromise;
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return new Response('離線', { status: 503 });
  }
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || new Response('離線', { status: 503 });
  }
}

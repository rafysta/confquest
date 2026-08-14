/* ConfQuest Service Worker
 * 方針: アプリ本体(同一オリジン)はネットワーク優先。
 *       更新が即座に反映され、オフライン時のみキャッシュを使う。
 *       CDN(pdf.js)はキャッシュ優先。
 */
const CACHE_VERSION = 'cq-v8';
const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/version.js',
  './js/app.js',
  './js/practice.js',
  './js/talk.js',
  './js/scenarios.js',
  './js/convo.js',
  './js/ai.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // 1つ失敗しても install 全体を止めない
      Promise.allSettled(APP_SHELL.map((u) => cache.add(u)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  // API呼び出しはキャッシュしない
  if (url.hostname === 'api.anthropic.com' || url.hostname === 'api.openai.com') return;

  if (url.origin === self.location.origin) {
    // アプリ本体: ネットワーク優先 → 失敗時キャッシュ
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(event.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(event.request).then((c) => c || Response.error()))
    );
  } else {
    // CDN等: キャッシュ優先
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});

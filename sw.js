/* ConfQuest Service Worker
 * 方針: アプリ本体(同一オリジン)はHTTPキャッシュを完全に迂回して取得する。
 *       GitHub Pagesなどが返す Cache-Control によって古いファイルが
 *       使われ続けるのを防ぐため、fetch に cache:'no-store' を指定する。
 *       ネットワークが使えないときだけ Cache Storage を使う。
 *       CDN(pdf.js)はキャッシュ優先。
 */
const CACHE_VERSION = 'cq-v68';
const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/version.js',
  './js/flags.js',
  './js/app.js',
  './js/practice.js',
  './js/talk.js',
  './js/audioimport.js',
  './js/backup.js',
  './js/scenarios.js',
  './js/convo.js',
  './js/cards.js',
  './js/minigames.js',
  './js/bosses.js',
  './js/run.js',
  './js/progress.js',
  './js/phrases.js',
  './js/voices.js',
  './js/learn.js',
  './js/route.js',
  './js/topics.js',
  './js/drive.js',
  './js/ai.js',
  './manifest.json',
  './version.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.allSettled(APP_SHELL.map((u) => {
        // 同一オリジンのファイルはHTTPキャッシュを迂回して取り込む
        const req = u.startsWith('http')
          ? new Request(u)
          : new Request(u, { cache: 'no-store' });
        return fetch(req).then((res) => res.ok && cache.put(u, res));
      }))
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
  if (url.hostname === 'api.anthropic.com' || url.hostname === 'api.openai.com') return;

  if (url.origin === self.location.origin) {
    // アプリ本体: HTTPキャッシュを使わず必ずサーバーに問い合わせる
    event.respondWith(
      fetch(new Request(event.request.url, {
        cache: 'no-store',
        credentials: 'same-origin'
      }))
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(event.request, copy));
          }
          return res;
        })
        .catch(() =>
          // ?v= 付きURLでもオフライン時にキャッシュへ届くよう、クエリを無視して照合
          caches.match(event.request, { ignoreSearch: true })
            .then((c) => c || Response.error())
        )
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});

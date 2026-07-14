// 한국어 문법 학습 앱 — 서비스 워커 (PWA 설치/오프라인 지원용)
const CACHE_NAME = 'kgrammar-cache-v1';
const APP_SHELL = ['./', './index.html', './manifest.json'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(APP_SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // Google Apps Script 등 외부(다른 출처) 요청은 캐시하지 않고 그대로 네트워크로 보냄
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(res){
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, resClone); });
        return res;
      }).catch(function(){ return caches.match('./index.html'); });
    })
  );
});

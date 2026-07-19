// 한국어 문법 학습 앱 — 서비스 워커 (PWA 설치/오프라인 지원용)
// v2: network-first로 변경 — 항상 최신 버전을 먼저 시도하고,
// 오프라인일 때만 저장된 캐시를 사용합니다.
const CACHE_NAME = 'kgrammar-cache-v2';
const APP_SHELL = ['./', './index.html', './manifest.json'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(APP_SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      // 이전 버전 캐시(v1 등)를 전부 삭제해서 옛날 파일이 남아있지 않도록 함
      return Promise.all(keys.filter(function(k){ return k!==CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // Google Apps Script 등 외부(다른 출처) 요청은 그대로 네트워크로 보냄 (캐시 안 함)
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request).then(function(res){
      // 네트워크 성공 → 최신 파일로 캐시 갱신 후 그대로 반환
      var resClone = res.clone();
      caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, resClone); });
      return res;
    }).catch(function(){
      // 네트워크 실패(오프라인) → 저장된 캐시로 대체
      return caches.match(e.request).then(function(cached){
        return cached || caches.match('./index.html');
      });
    })
  );
});

var prefix = location.host === "stankay7bc.github.io" ? "/notepad" : "";
var CACHE_NAME = "notepad-cache-1"
var urlsCache = [
  `${prefix}/`,
  `${prefix}/editor.html`,
  `${prefix}/styles/index.css`,
  `${prefix}/styles/editor.css`,
  `${prefix}/scripts/editor.js`,
  `${prefix}/scripts/index.js`,
  `${prefix}/scripts/index_ui.js`,
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request,{ignoreSearch:true})
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
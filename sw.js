var CACHE = "hoc-vui-v2";
var ASSETS = [
  "./",
  "./index.html",
  "./css/app.css",
  "./manifest.webmanifest",
  "./js/util.js",
  "./js/storage.js",
  "./js/audio.js",
  "./js/speech.js",
  "./js/art.js",
  "./js/generators.js",
  "./js/catalog.js",
  "./js/engine.js",
  "./js/app.js",
  "./js/firebase-sync.js",
  "./content/daily/2026-11-02.json",
  "./assets/icons/favicon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./fonts/nunito-700-latin.woff2",
  "./fonts/nunito-700-vietnamese.woff2",
  "./fonts/nunito-800-latin.woff2",
  "./fonts/nunito-800-vietnamese.woff2"
];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(ASSETS);
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) {
      return caches.delete(key);
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  var url = new URL(request.url);
  var sameOrigin = url.origin === self.location.origin;
  var firebase = url.hostname === "www.gstatic.com" && url.pathname.indexOf("/firebasejs/") === 0;
  if (!sameOrigin && !firebase) return;
  event.respondWith(fetch(request).then(function (response) {
    if (response && response.ok) {
      var copy = response.clone();
      caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
    }
    return response;
  }).catch(function () {
    return caches.match(request).then(function (cached) {
      return cached || caches.match("./index.html");
    });
  }));
});

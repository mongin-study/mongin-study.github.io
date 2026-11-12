var CACHE = "hoc-vui-v37";
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
  "./js/learn.js",
  "./js/english-bank.js",
  "./js/english-upper.js",
  "./js/engine.js",
  "./js/weekly.js",
  "./js/memory.js",
  "./js/stickers.js",
  "./js/tangram.js",
  "./js/shop.js",
  "./js/worksheet.js",
  "./js/app.js",
  "./content/memory/decks.json",
  "./content/weekly/2026-11-07.json",
  "./js/firebase-sync.js",
  "./content/daily/2026-11-02.json",
  "./content/daily/2026-11-05.json",
  "./content/daily/2026-11-06.json",
  "./content/daily/2026-11-09.json",
  "./content/daily/2026-11-10.json",
  "./content/daily/2026-11-11.json",
  "./content/daily/2026-11-12.json",
  "./content/daily/2026-11-13.json",
  "./assets/icons/favicon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./fonts/nunito-700-latin.woff2",
  "./fonts/nunito-700-vietnamese.woff2",
  "./fonts/nunito-800-latin.woff2",
  "./fonts/nunito-800-vietnamese.woff2",
  "./assets/kids/mon.webp",
  "./assets/kids/gin.webp",
  "./assets/audio/manifest.json",
  "./assets/audio/en/manifest.json",
  "./assets/stickers/carriage-flower.svg",
  "./assets/stickers/dream-sky.svg",
  "./assets/stickers/flower-magic.svg",
  "./assets/stickers/pony-cream.svg",
  "./assets/stickers/pony-pink.svg",
  "./assets/stickers/rainbow-arch.svg",
  "./assets/stickers/rapunzel-boat.svg",
  "./assets/stickers/rapunzel-braid.svg",
  "./assets/stickers/rapunzel-chameleon.svg",
  "./assets/stickers/rapunzel-crown.svg",
  "./assets/stickers/rapunzel-flower.svg",
  "./assets/stickers/rapunzel-friend.svg",
  "./assets/stickers/rapunzel-gown.svg",
  "./assets/stickers/rapunzel-hair.svg",
  "./assets/stickers/rapunzel-kingdom.svg",
  "./assets/stickers/rapunzel-lantern.svg",
  "./assets/stickers/rapunzel-lanterns.svg",
  "./assets/stickers/rapunzel-magic.svg",
  "./assets/stickers/rapunzel-princess.svg",
  "./assets/stickers/rapunzel-ribbon.svg",
  "./assets/stickers/rapunzel-smile.svg",
  "./assets/stickers/rapunzel-sun.svg",
  "./assets/stickers/rapunzel-tower.svg",
  "./assets/stickers/rapunzel-window.svg",
  "./assets/stickers/rapunzel-wreath.svg",
  "./assets/stickers/spark-heart.svg",
  "./assets/stickers/star-smile.svg",
  "./assets/stickers/uni-baby.svg",
  "./assets/stickers/uni-cloud.svg",
  "./assets/stickers/uni-crown.svg",
  "./assets/stickers/uni-fly.svg",
  "./assets/stickers/uni-legend.svg",
  "./assets/stickers/uni-mane.svg",
  "./assets/stickers/uni-pastel.svg",
  "./assets/stickers/uni-pink.svg",
  "./assets/stickers/uni-rainbow.svg",
  "./assets/stickers/uni-stars.svg",
  "./assets/stickers/uni-white.svg",
  "./assets/stickers/wand-pink.svg",
  "./assets/stickers/wand-star.svg"
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

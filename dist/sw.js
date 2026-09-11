const CACHE_NAME = "control-site-v5";
const APP_SHELL = [
  "/",
  "/#Home",
  "/styles/App.css",
  "/styles/Home.css",
  "/styles/HomeV2.css",
  "/styles/ZipControlHome.css",
  "/styles/ZipControlApp.css",
  "/styles/ControlAuth.css?v=1.1.0",
  "/scripts/ControlAuth.js?v=1.0.0",
  "/styles/ControlStudio.css?v=1.2.0",
  "/assets/landing/ControlLoginBackground.png",
  "/assets/landing/ControlStudioBackground.png",
  "/scripts/ControlStudio.js?v=1.1.0",
  "/scripts/Dashboard.js",
  "/scripts/HomeV2.js",
  "/scripts/ZipControlApp.js",
  "/assets/ControlSelectedBlack.png",
  "/assets/ControlUnifiedIcon128.png",
  "/assets/ControlUnifiedIcon512.png",
  "/assets/Reddit.svg",
  "/assets/Threads.svg",
  "/assets/Facebook.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
  );
});

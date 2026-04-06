/// <reference lib="webworker" />

const CACHE_NAME = "guesthub-v2";

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/logo.png",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install — precache shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first for navigations & API, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API calls — network only (don't cache)
  if (url.pathname.startsWith("/api/")) return;

  // Static assets in /icons and font/image files — cache-first
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?|ttf)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // Navigation & other — network-first with offline fallback
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) => cached || new Response("Offline", { status: 503, statusText: "Service Unavailable" })
        )
      )
  );
});

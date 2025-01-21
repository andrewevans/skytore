/*eslint no-unused-vars: ["error", { "caughtErrors": "none" }]*/
// This is the "Offline page" service worker

self.importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js",
)

const CACHE_NAME = "pwabuilder-page"

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
const APP_STATIC_RESOURCES = [
  "/",
  "/index.html",
  "/skvto.css",
  "/js/skvto.js",
  "vourer/favicon_io/android-chrome-512x512.png",
  "vourer/favicon_io/android-chrome-192x192.png",
  "vourer/offline.html",
]

const offlineFallbackPage = "vourer/offline.html"

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// On install, cache the static resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      cache.addAll(APP_STATIC_RESOURCES)
    })(),
  )
})

if (self.workbox.navigationPreload.isSupported()) {
  self.workbox.navigationPreload.enable()
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name)
          }
        }),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloadResp = await event.preloadResponse

          if (preloadResp) {
            return preloadResp
          }

          const networkResp = await fetch(event.request)
          return networkResp
        } catch (error) {
          const cache = await caches.open(CACHE_NAME)
          const cachedResp = await cache.match(offlineFallbackPage)
          return cachedResp
        }
      })(),
    )
  }
})

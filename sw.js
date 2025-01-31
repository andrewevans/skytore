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
  "favicon.ico",
  "vourer/offline.html",
  "pages/part-1.txt",
  "pages/part-2.txt",
  "vourer/skvto.json",
  "/Webdings-Regular.ttf",
  "/imperial-normal-500.ttf",
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

const putInCache = async (request, response) => {
  const cache = await caches.open("v1")
  await cache.put(request, response)
}

const cacheFirst = async ({ request }) => {
  // First try to get the resource from the cache...
  const responseFromCache = await caches.match(request, { ignoreSearch: true })
  if (responseFromCache) {
    return responseFromCache
  }

  // If the response was not found in the cache,
  // try to get the resource from the network.
  try {
    const responseFromNetwork = await fetch(request)
    // If the network request succeeded, clone the response:
    // - put one copy in the cache, for the next time
    // - return the original to the app
    // Cloning is needed because a response can only be consumed once.
    putInCache(request, responseFromNetwork.clone())
    return responseFromNetwork
  } catch (error) {
    // When even the fallback response is not available,
    // there is nothing we can do, but we must always
    // return a Response object.
    return new Response("Network error happened", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    })
  }
}

self.addEventListener("fetch", (event) => {
  event.respondWith(
    cacheFirst({
      request: event.request,
      fallbackUrl: offlineFallbackPage,
    }),
  )
})

/*
const deleteCache = async (key) => {
  await caches.delete(key);
};

const deleteOldCaches = async () => {
  const cacheKeepList = ["v2"];
  const keyList = await caches.keys();
  const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
  await Promise.all(cachesToDelete.map(deleteCache));
};

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteOldCaches());
});
*/

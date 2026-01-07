// OLD SERVICE WORKER - NO LONGER USED
// This file has been replaced by sw-template.js which generates sw.js at build time
//
// The new system provides:
// 1. Automated version numbers from package.json + timestamp
// 2. Dynamic asset list generation from build output
// 3. Offline-first caching strategy
//
// To use the new system, run: npm run build

// NOTE: This only works in HTTPS
const cacheName = "v15";

const addResourcesToCache = async (resources) => {
  const cache = await caches.open(cacheName);
  await cache.addAll(resources);
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    addResourcesToCache([
      "/",
      "/index.html",
      "/help.html",
      "/test_stl_file.stl",
      "/TF-IschialContainment_20151230164058.stl",
      "/Crosswalk.stl",
      "/assets/global-style.css",
      "/assets/global-style.js",
      "/assets/index.js",
      "/assets/index2.js",
      "/assets/main.js",
      "/assets/sliceWorker-BMZJ18CQ.js",
      "/assets/three-mesh-bvh.js",
      "/assets/three.js",
    ])
  );
});

self.addEventListener("activate", async () => {
  await self.clients.claim();

  const cacheWhitelist = [cacheName];
  const cacheNames = await caches.keys();

  await Promise.all(
    cacheNames.map(async (cacheName) => {
      if (!cacheWhitelist.includes(cacheName)) {
        await caches.delete(cacheName);
      }
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);

      if (cachedResponse) {
        return cachedResponse;
      }

      const cache = await caches.open(cacheName);

      try {
        const networkResponse = await fetch(event.request);

        if (event.request.method === "GET" && networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (_err) {
        const offlineResponse = await caches.match("/no-network.html");
        return (
          offlineResponse ||
          new Response(".... network error...", { status: 404 })
        );
      }
    })()
  );
});

// Service Worker Template - Generated at build time
// NOTE: This only works in HTTPS
const cacheName = "__CACHE_VERSION__";

const assetsToCache = __ASSETS_TO_CACHE__;

const addResourcesToCache = async (resources) => {
  const cache = await caches.open(cacheName);

  // Cache resources in batches to avoid overwhelming the network
  const batchSize = 10;
  for (let i = 0; i < resources.length; i += batchSize) {
    const batch = resources.slice(i, i + batchSize);
    try {
      await cache.addAll(batch);
    } catch (error) {
      console.warn("Failed to cache batch:", batch, error);
      // Try to cache individually if batch fails
      for (const resource of batch) {
        try {
          await cache.add(resource);
        } catch (individualError) {
          console.warn("Failed to cache resource:", resource, individualError);
        }
      }
    }
  }
};

self.addEventListener("install", (event) => {
  console.log("Service Worker installing, cache version:", cacheName);
  event.waitUntil(
    addResourcesToCache(assetsToCache).then(() => {
      console.log("All resources cached successfully");
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", async (event) => {
  console.log("Service Worker activating, cache version:", cacheName);
  event.waitUntil(
    (async () => {
      // Take control of all clients immediately
      await self.clients.claim();

      // Clean up old caches
      const cacheWhitelist = [cacheName];
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames.map(async (oldCacheName) => {
          if (!cacheWhitelist.includes(oldCacheName)) {
            console.log("Deleting old cache:", oldCacheName);
            await caches.delete(oldCacheName);
          }
        })
      );

      console.log("Service Worker activated successfully");
    })()
  );
});

// Offline-first strategy: Check cache first, then network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Try cache first (offline-first approach)
        const cachedResponse = await caches.match(event.request);

        if (cachedResponse) {
          // For HTML files, also try to update cache in background
          if (event.request.destination === "document") {
            // Background update - don't await this
            fetch(event.request)
              .then(async (networkResponse) => {
                if (networkResponse && networkResponse.ok) {
                  const cache = await caches.open(cacheName);
                  await cache.put(event.request, networkResponse.clone());
                }
              })
              .catch(() => {
                // Ignore network errors in background update
              });
          }

          return cachedResponse;
        }

        // If not in cache, try network
        const networkResponse = await fetch(event.request);

        // Cache successful responses
        if (networkResponse && networkResponse.ok) {
          const cache = await caches.open(cacheName);
          // Clone the response before caching
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        console.warn("Fetch failed for:", event.request.url, error);

        // For navigation requests, return a generic offline page
        if (event.request.destination === "document") {
          const offlineResponse = await caches.match("/index.html");
          if (offlineResponse) {
            return offlineResponse;
          }
        }

        // For other requests, return a basic error response
        return new Response(
          JSON.stringify({
            error: "Network unavailable",
            offline: true,
            url: event.request.url,
          }),
          {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    })()
  );
});

// Handle background sync for when connection is restored
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag);
  // You can implement background sync logic here if needed
});

// Handle push notifications if needed in the future
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);
  // You can implement push notification logic here if needed
});

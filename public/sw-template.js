const CACHE_NAME = "__CACHE_VERSION__";
const APP_VERSION = "__APP_VERSION__";

const PRECACHE_URLS = __ASSETS_TO_CACHE__;

const NETWORK_TIMEOUT_MS = 2500;

let cachePromise = null;
const openCache = () => {
  cachePromise ??= caches.open(CACHE_NAME);
  return cachePromise;
};

const addResourcesToCache = async (resources) => {
  const cache = await openCache();
  const failed = [];

  const batchSize = 10;
  for (let i = 0; i < resources.length; i += batchSize) {
    const batch = resources.slice(i, i + batchSize);
    try {
      await cache.addAll(batch);
    } catch (error) {
      console.warn("Failed to cache batch:", batch, error);
      for (const resource of batch) {
        try {
          await cache.add(resource);
        } catch (individualError) {
          console.warn("Failed to cache resource:", resource, individualError);
          failed.push(resource);
        }
      }
    }
  }

  return failed;
};

const offlineResponse = (request) =>
  new Response(`Network unavailable, and no cached copy of ${request.url}`, {
    status: 503,
    statusText: "Service Unavailable",
    headers: { "Content-Type": "text/plain" },
  });

const withTimeout = (promise, ms) => {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Network timeout")), ms);
  });

  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
};

const documentFallback = async (request, cache) =>
  request.destination === "document"
    ? ((await cache.match("/index.html")) ?? null)
    : null;

const networkFirst = async (event) => {
  const { request } = event;
  const cache = await openCache();
  const cached = await cache.match(request);

  const network = fetch(request).then(async (response) => {
    if (response.ok && !response.redirected) {
      await cache.put(request, response.clone());
    }
    return response;
  });

  event.waitUntil(network.catch(() => {}));

  if (!cached) {
    try {
      return await network;
    } catch (error) {
      console.warn("Fetch failed with no cached copy:", request.url, error);
      return (await documentFallback(request, cache)) ?? offlineResponse(request);
    }
  }

  try {
    const response = await withTimeout(network, NETWORK_TIMEOUT_MS);
    return response.ok ? response : cached;
  } catch {
    return cached;
  }
};

const shouldHandle = (request) => {
  if (request.method !== "GET") {
    return false;
  }

  const url = new URL(request.url);

  return url.protocol.startsWith("http") && url.origin === self.location.origin;
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const failed = await addResourcesToCache(PRECACHE_URLS);

      if (failed.length > 0) {
        throw new Error(
          `Service Worker install aborted: ${failed.length} of ${PRECACHE_URLS.length} assets could not be cached (first: ${failed[0]})`
        );
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();

      const allClients = await self.clients.matchAll();
      for (const client of allClients) {
        client.postMessage({ type: "SW_UPDATED", version: APP_VERSION });
      }

      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter((oldCacheName) => oldCacheName !== CACHE_NAME)
          .map((oldCacheName) => caches.delete(oldCacheName))
      );
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (!shouldHandle(event.request)) {
    return;
  }

  event.respondWith(networkFirst(event));
});

self.addEventListener("message", (event) => {
  const type = event.data?.type;

  if (type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (type === "GET_VERSION") {
    event.ports[0]?.postMessage({ type: "VERSION", version: APP_VERSION });
  }
});

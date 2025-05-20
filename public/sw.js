const cacheName = "v1";

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
		]),
	);
});

self.addEventListener("activate", async (event) => {
	// Claim clients immediately so the service worker starts controlling them
	await self.clients.claim();
	// Delete old caches if there is a new cache version
	const cacheWhitelist = [cacheName];
	const cacheNames = await caches.keys();
	await Promise.all(
		cacheNames.map(async (cacheName) => {
			if (!cacheWhitelist.includes(cacheName)) {
				await caches.delete(cacheName);
			}
		}),
	);
});

self.addEventListener("fetch", (event) => {
	console.log("Fetch event for ", event.request.url);

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
			} catch (err) {
				const offlineResponse = await caches.match("/no-network.html");
				return (
					offlineResponse ||
					new Response(".... network error...", { status: 404 })
				);
			}
		})(),
	);
});

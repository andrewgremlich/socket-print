const UPDATE_POLL_MS = 15 * 60 * 1000;

const VERSION_REPLY_TIMEOUT_MS = 2000;

let reloading = false;

function requestVersion(worker: ServiceWorker): Promise<string | undefined> {
	return new Promise((resolve) => {
		const channel = new MessageChannel();

		const timer = window.setTimeout(() => {
			channel.port1.close();
			resolve(undefined);
		}, VERSION_REPLY_TIMEOUT_MS);

		channel.port1.onmessage = (event) => {
			window.clearTimeout(timer);
			channel.port1.close();
			resolve(
				typeof event.data?.version === "string"
					? event.data.version
					: undefined,
			);
		};

		worker.postMessage({ type: "GET_VERSION" }, [channel.port2]);
	});
}

async function announceUpdate(waiting: ServiceWorker) {
	const notification = document.querySelector("update-notification");

	if (!(notification instanceof HTMLElement) || !("show" in notification)) {
		return;
	}

	const banner = notification as HTMLElement & {
		show: (version?: string) => void;
		onReload?: () => void;
	};

	banner.onReload = () => {
		waiting.postMessage({ type: "SKIP_WAITING" });
	};

	banner.show(await requestVersion(waiting));
}

export function registerServiceWorker() {
	if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
		return;
	}

	navigator.serviceWorker.addEventListener("controllerchange", () => {
		if (reloading) {
			return;
		}
		reloading = true;
		window.location.reload();
	});

	navigator.serviceWorker
		.register("/sw.js")
		.then((registration) => {
			if (registration.waiting) {
				announceUpdate(registration.waiting);
			}

			registration.addEventListener("updatefound", () => {
				const installing = registration.installing;

				if (!installing) {
					return;
				}

				installing.addEventListener("statechange", () => {
					if (
						installing.state === "installed" &&
						navigator.serviceWorker.controller
					) {
						announceUpdate(installing);
					}
				});
			});

			setInterval(() => {
				registration.update();
			}, UPDATE_POLL_MS);
		})
		.catch((error) => {
			console.error("Service Worker registration failed:", error);
		});
}

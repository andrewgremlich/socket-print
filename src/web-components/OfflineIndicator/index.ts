import styles from "./OfflineIndicator.css?inline";
import template from "./OfflineIndicator.html?raw";

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class OfflineIndicator extends HTMLElement {
	#indicator: HTMLDivElement;
	#isOnline: boolean = navigator.onLine;
	#hideTimer: number | null = null;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [sheet];
	}

	connectedCallback() {
		this.#render();
		this.#setupEventListeners();
		this.#checkCacheStatus();
		this.#updateStatus();
	}

	disconnectedCallback() {
		window.removeEventListener("online", this.#handleOnline);
		window.removeEventListener("offline", this.#handleOffline);
		this.#clearHideTimer();
	}

	#handleOnline = () => {
		this.#isOnline = true;
		this.#clearHideTimer();
		this.#updateStatus();
	};

	#handleOffline = () => {
		this.#isOnline = false;
		this.#updateStatus();
	};

	#setupEventListeners() {
		window.addEventListener("online", this.#handleOnline);
		window.addEventListener("offline", this.#handleOffline);
	}

	async #checkCacheStatus() {
		if ("serviceWorker" in navigator && "caches" in window) {
			try {
				const cacheNames = await caches.keys();
				if (cacheNames.length > 0 && !this.#isOnline) {
					this.#updateStatus(true);
				}
			} catch (error) {
				console.warn("Failed to check cache status:", error);
			}
		}
	}

	#clearHideTimer() {
		if (this.#hideTimer !== null) {
			clearTimeout(this.#hideTimer);
			this.#hideTimer = null;
		}
	}

	#startHideTimer() {
		this.#clearHideTimer();
		this.#hideTimer = window.setTimeout(() => {
			if (this.#indicator) {
				this.#indicator.classList.add("fade-out");
				// Wait for animation to complete before hiding
				setTimeout(() => {
					if (this.#indicator) {
						this.#indicator.style.display = "none";
						this.#indicator.classList.remove("fade-out");
					}
				}, 300);
			}
			this.#hideTimer = null;
		}, 10000); // 10 seconds
	}

	#updateStatus(hasCachedContent: boolean = false) {
		if (!this.#indicator) return;

		if (this.#isOnline) {
			this.#clearHideTimer();
			this.#indicator.style.display = "none";
		} else {
			this.#indicator.style.display = "block";

			if (hasCachedContent) {
				this.#indicator.textContent = "Offline Mode - Cached Content Available";
				this.#indicator.style.background = "#0d9488";
			} else {
				this.#indicator.textContent = "Offline Mode";
				this.#indicator.style.background = "#dc2626";
			}

			// Start the auto-hide timer
			this.#startHideTimer();
		}
	}

	#render() {
		this.shadowRoot.innerHTML = template;

		this.#indicator = this.shadowRoot.getElementById(
			"indicator",
		) as HTMLDivElement;
	}
}

customElements.define("offline-indicator", OfflineIndicator);

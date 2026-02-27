class OfflineIndicator extends HTMLElement {
	#indicator: HTMLDivElement;
	#isOnline: boolean = navigator.onLine;
	#hideTimer: number | null = null;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
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
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					position: fixed;
					top: 10px;
					right: 10px;
					z-index: 10000;
					pointer-events: none;
				}

				.offline-indicator {
					background: #dc2626;
					color: white;
					padding: 8px 16px;
					border-radius: 4px;
					font-size: 14px;
					font-weight: bold;
					box-shadow: 0 2px 8px rgba(0,0,0,0.2);
					display: none;
					transition: all 0.3s ease;
					pointer-events: auto;
				}

				.offline-indicator.cached {
					background: #0d9488;
				}

				.offline-indicator.show {
					display: block;
					animation: slideIn 0.3s ease-out;
				}

				.offline-indicator.fade-out {
					animation: fadeOut 0.3s ease-out;
				}

				@keyframes slideIn {
					from {
						transform: translateX(100%);
						opacity: 0;
					}
					to {
						transform: translateX(0);
						opacity: 1;
					}
				}

				@keyframes fadeOut {
					from {
						opacity: 1;
					}
					to {
						opacity: 0;
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.offline-indicator {
						transition: none;
					}

					.offline-indicator.show {
						animation: none;
					}

					.offline-indicator.fade-out {
						animation: none;
						opacity: 0;
					}
				}

				@media (max-width: 768px) {
					:host {
						top: 5px;
						right: 5px;
					}

					.offline-indicator {
						font-size: 12px;
						padding: 6px 12px;
					}
				}
			</style>
			<div class="offline-indicator" id="indicator" role="status" aria-live="polite" aria-label="Network status indicator">
				Offline Mode
			</div>
		`;

		this.#indicator = this.shadowRoot.getElementById(
			"indicator",
		) as HTMLDivElement;
	}
}

customElements.define("offline-indicator", OfflineIndicator);

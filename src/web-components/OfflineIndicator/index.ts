class OfflineIndicator extends HTMLElement {
	private indicator: HTMLDivElement;
	private isOnline: boolean = navigator.onLine;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		this.render();
		this.setupEventListeners();
		this.checkCacheStatus();
		this.updateStatus();
	}

	disconnectedCallback() {
		window.removeEventListener("online", this.handleOnline);
		window.removeEventListener("offline", this.handleOffline);
	}

	private handleOnline = () => {
		this.isOnline = true;
		this.updateStatus();
	};

	private handleOffline = () => {
		this.isOnline = false;
		this.updateStatus();
	};

	private setupEventListeners() {
		window.addEventListener("online", this.handleOnline);
		window.addEventListener("offline", this.handleOffline);
	}

	private async checkCacheStatus() {
		if ("serviceWorker" in navigator && "caches" in window) {
			try {
				const cacheNames = await caches.keys();
				if (cacheNames.length > 0 && !this.isOnline) {
					this.updateStatus(true);
				}
			} catch (error) {
				console.warn("Failed to check cache status:", error);
			}
		}
	}

	private updateStatus(hasCachedContent: boolean = false) {
		if (!this.indicator) return;

		if (this.isOnline) {
			this.indicator.style.display = "none";
		} else {
			this.indicator.style.display = "block";

			if (hasCachedContent) {
				this.indicator.textContent = "Offline Mode - Cached Content Available";
				this.indicator.style.background = "#4ecdc4";
			} else {
				this.indicator.textContent = "Offline Mode";
				this.indicator.style.background = "#ff6b6b";
			}
		}
	}

	private render() {
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
					background: #ff6b6b;
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
					background: #4ecdc4;
				}

				.offline-indicator.show {
					display: block;
					animation: slideIn 0.3s ease-out;
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
			<div class="offline-indicator" id="indicator">
				Offline Mode
			</div>
		`;

		this.indicator = this.shadowRoot.getElementById(
			"indicator",
		) as HTMLDivElement;
	}
}

customElements.define("offline-indicator", OfflineIndicator);

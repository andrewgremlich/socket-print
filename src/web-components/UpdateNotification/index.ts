class UpdateNotification extends HTMLElement {
	#banner: HTMLDivElement;
	#hideTimer: number | null = null;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		this.#render();
	}

	disconnectedCallback() {
		this.#clearHideTimer();
	}

	show() {
		this.#banner.style.display = "flex";
		requestAnimationFrame(() => {
			this.#banner.classList.add("visible");
		});

		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		this.#hideTimer = window.setTimeout(
			() => {
				this.#hide();
			},
			prefersReducedMotion ? 60000 : 30000,
		);
	}

	#hide() {
		this.#clearHideTimer();

		const focused = this.shadowRoot.activeElement;
		if (focused instanceof HTMLElement) {
			focused.blur();
		}

		this.#banner.classList.remove("visible");
		this.#banner.addEventListener(
			"transitionend",
			() => {
				this.#banner.style.display = "none";
			},
			{ once: true },
		);
	}

	#clearHideTimer() {
		if (this.#hideTimer !== null) {
			clearTimeout(this.#hideTimer);
			this.#hideTimer = null;
		}
	}

	#render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					position: fixed;
					bottom: 16px;
					left: 50%;
					transform: translateX(-50%);
					z-index: 10000;
				}

				.update-banner {
					display: none;
					align-items: center;
					gap: 12px;
					background: #1e293b;
					color: #f1f5f9;
					padding: 10px 16px;
					border-radius: 8px;
					font-size: 14px;
					box-shadow: 0 4px 12px rgba(0,0,0,0.3);
					opacity: 0;
					transform: translateY(20px);
					transition: opacity 0.3s ease, transform 0.3s ease;
				}

				.update-banner.visible {
					opacity: 1;
					transform: translateY(0);
				}

				button {
					border: none;
					border-radius: 4px;
					padding: 6px 12px;
					font-size: 13px;
					cursor: pointer;
					font-weight: 600;
				}

				button:focus-visible {
					outline: 2px solid #93c5fd;
					outline-offset: 2px;
				}

				.reload-btn {
					background: #3b82f6;
					color: white;
				}

				.reload-btn:hover {
					background: #2563eb;
				}

				.dismiss-btn {
					background: transparent;
					color: #cbd5e1;
				}

				.dismiss-btn:hover {
					color: #f1f5f9;
				}

				@media (prefers-reduced-motion: reduce) {
					.update-banner {
						transition: none;
					}
				}

				@media (max-width: 768px) {
					:host {
						bottom: 8px;
						left: 8px;
						right: 8px;
						transform: none;
					}

					.update-banner {
						font-size: 13px;
					}
				}
			</style>
			<div class="update-banner" role="alert" aria-live="polite">
				<span>A new version is available.</span>
				<button class="reload-btn">Reload</button>
				<button class="dismiss-btn">Dismiss</button>
			</div>
		`;

		this.#banner = this.shadowRoot.querySelector(
			".update-banner",
		) as HTMLDivElement;

		this.shadowRoot
			.querySelector(".reload-btn")
			.addEventListener("click", () => {
				window.location.reload();
			});

		this.shadowRoot
			.querySelector(".dismiss-btn")
			.addEventListener("click", () => {
				this.#hide();
			});
	}
}

customElements.define("update-notification", UpdateNotification);

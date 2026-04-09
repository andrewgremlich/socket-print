import { version as currentVersion } from "pkg";

class UpdateNotification extends HTMLElement {
	#banner: HTMLDivElement;
	#message: HTMLSpanElement;
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

	show(newVersion?: string) {
		const isMajor =
			newVersion != null &&
			Number.parseInt(newVersion.split(".")[0], 10) >
				Number.parseInt(currentVersion.split(".")[0], 10);

		this.#message.textContent = isMajor
			? "A major update is available."
			: "A new version is available.";

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

		const focused = this.shadowRoot?.activeElement;
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
		if (!this.shadowRoot) return;

		this.shadowRoot.innerHTML = `
			<link rel="stylesheet" href="styles/update-notification.css">
			<div class="update-banner" role="alert" aria-live="polite">
				<span class="message">A new version is available.</span>
				<button class="reload-btn">Reload</button>
				<button class="dismiss-btn">Dismiss</button>
			</div>
		`;

		this.#banner = this.shadowRoot?.querySelector(
			".update-banner",
		) as HTMLDivElement;

		this.#message = this.shadowRoot?.querySelector(
			".message",
		) as HTMLSpanElement;

		this.shadowRoot
			?.querySelector(".reload-btn")
			?.addEventListener("click", () => {
				window.location.reload();
			});

		this.shadowRoot
			?.querySelector(".dismiss-btn")
			?.addEventListener("click", () => {
				this.#hide();
			});
	}
}

customElements.define("update-notification", UpdateNotification);

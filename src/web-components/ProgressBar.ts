export class ProgressBar extends HTMLElement {
	#progressBar: HTMLProgressElement;
	#label: HTMLLabelElement;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					position: fixed;
					z-index: var(--z-dropdown);
					bottom: var(--spacing-sm);
					left: var(--spacing-sm);
					background-color: var(--bg-menu);
					padding: 0px var(--spacing-md);
					border-radius: var(--radius-lg);
					box-shadow: var(--shadow-dropdown);
					display: none;
					align-items: center;
				}

				:host > * {
					margin: var(--spacing-sm);
				}

				.spin-icon {
					flex-shrink: 0;
					width: 24px;
					height: 24px;
					border: 3px solid var(--text-secondary);
					border-top-color: var(--accent-color);
					border-radius: 50%;
					animation: loading 1s linear infinite;
				}

				label {
					color: var(--text-primary);
					font-size: 14px;
				}

				@keyframes loading {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}

				@media (prefers-reduced-motion: reduce) {
					.spin-icon {
						animation: none;
					}
				}
			</style>
			<div class="spin-icon" aria-hidden="true"></div>
			<label id="label">0%</label>
			<progress id="progress" value="0" max="100"></progress>
		`;

		this.#label = this.shadowRoot.getElementById("label") as HTMLLabelElement;
		this.#progressBar = this.shadowRoot.getElementById(
			"progress",
		) as HTMLProgressElement;
	}

	get value(): number {
		return this.#progressBar.value;
	}

	set value(val: number) {
		this.#progressBar.value = val;
		this.#label.textContent = `${val}%`;
	}

	show() {
		this.style.display = "flex";
	}

	hide() {
		this.style.display = "none";
	}

	reset() {
		this.value = 0;
		this.hide();
	}
}

customElements.define("progress-bar", ProgressBar);

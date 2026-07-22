import styles from "./ProgressBar.css?inline";
import template from "./ProgressBar.html?raw";

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

export class ProgressBar extends HTMLElement {
	#progressBar: HTMLProgressElement;
	#label: HTMLLabelElement;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [sheet];
		this.shadowRoot.innerHTML = template;

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

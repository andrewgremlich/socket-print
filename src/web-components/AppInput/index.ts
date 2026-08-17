import styles from "./AppInput.css?inline";
import template from "./AppInput.html?raw";

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

export class AppInput extends HTMLElement {
	static formAssociated = true;

	#shadow: ShadowRoot;
	#internals: ElementInternals;
	#input: HTMLInputElement;
	#label: HTMLLabelElement;

	static get observedAttributes() {
		return [
			"label",
			"type",
			"name",
			"value",
			"placeholder",
			"disabled",
			"min",
			"max",
			"step",
			"direction",
			"aria-required",
			"aria-label",
			"aria-describedby",
		];
	}

	constructor() {
		super();
		this.#shadow = this.attachShadow({ mode: "open" });
		this.#internals = this.attachInternals();
		this.#shadow.adoptedStyleSheets = [sheet];
		this.#shadow.innerHTML = template;

		this.#label = this.#shadow.querySelector("label") as HTMLLabelElement;
		this.#input = this.#shadow.querySelector("input") as HTMLInputElement;

		this.#input.addEventListener("input", () => {
			this.#internals.setFormValue(this.#input.value);
			this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
		});

		this.#input.addEventListener("change", () => {
			this.#internals.setFormValue(this.#input.value);
			this.dispatchEvent(
				new Event("change", { bubbles: true, composed: true }),
			);
		});
	}

	get input(): HTMLInputElement {
		return this.#input;
	}

	get value(): string {
		return this.#input.value;
	}

	set value(val: string) {
		this.#input.value = val;
		this.#internals.setFormValue(val);
	}

	get disabled(): boolean {
		return this.#input.disabled;
	}

	set disabled(val: boolean) {
		this.#input.disabled = val;
		if (val) {
			this.setAttribute("disabled", "");
		} else {
			this.removeAttribute("disabled");
		}
	}

	get name(): string {
		return this.getAttribute("name") ?? "";
	}

	attributeChangedCallback(
		attrName: string,
		_oldVal: string | null,
		newVal: string | null,
	) {
		switch (attrName) {
			case "label":
				this.#label.textContent = newVal ?? "";
				break;
			case "disabled":
				this.#input.disabled = newVal !== null;
				break;
			case "value":
				this.#input.value = newVal ?? "";
				this.#internals.setFormValue(newVal ?? "");
				break;
			case "aria-required":
			case "aria-label":
			case "aria-describedby":
				if (newVal !== null) {
					this.#input.setAttribute(attrName, newVal);
				} else {
					this.#input.removeAttribute(attrName);
				}
				break;
			default:
				if (newVal !== null) {
					this.#input.setAttribute(attrName, newVal);
				} else {
					this.#input.removeAttribute(attrName);
				}
				break;
		}
	}
}

customElements.define("app-input", AppInput);

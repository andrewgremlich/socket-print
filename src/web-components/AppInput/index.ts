export class AppInput extends HTMLElement {
	static formAssociated = true;

	private _shadow: ShadowRoot;
	private _internals: ElementInternals;
	private _input: HTMLInputElement;
	private _label: HTMLLabelElement;

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
		this._shadow = this.attachShadow({ mode: "open" });
		this._internals = this.attachInternals();
		this._shadow.innerHTML = `
			<style>
				:host {
					display: flex;
					flex-direction: column;
				}

				:host([direction="row"]) {
					flex-direction: row;
					align-items: center;
					gap: var(--spacing-sm);
				}

				label {
					color: var(--text-secondary);
					font-size: 14px;
					font-family: var(--font-family);
				}

				input {
					font-family: var(--font-family);
					font-size: var(--font-size-sm);
					font-weight: 400;
					background-color: var(--bg-input);
					color: var(--text-primary);
					border: 1px solid var(--border-default);
					border-radius: var(--radius-md);
					padding: 8px 12px;
					box-shadow: var(--shadow-sm);
					transition:
						border-color var(--transition-normal),
						box-shadow var(--transition-normal),
						background-color var(--transition-normal);
				}

				input::placeholder {
					color: var(--text-placeholder);
				}

				input:hover:not(:focus):not([disabled]) {
					border-color: var(--border-hover);
					background-color: var(--bg-input-hover);
				}

				input:focus {
					outline: none;
					border-color: var(--accent-color);
					box-shadow:
						0 0 0 3px var(--accent-color-subtle),
						var(--shadow-sm);
					background-color: var(--bg-input);
				}

				input[disabled] {
					background-color: var(--bg-disabled);
					border-color: var(--border-disabled);
					color: var(--text-disabled);
					cursor: not-allowed;
					box-shadow: none;
				}
			</style>
			<label part="label"></label>
			<input part="input" />
		`;

		this._label = this._shadow.querySelector("label") as HTMLLabelElement;
		this._input = this._shadow.querySelector("input") as HTMLInputElement;

		this._input.addEventListener("input", () => {
			this._internals.setFormValue(this._input.value);
			this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
		});

		this._input.addEventListener("change", () => {
			this._internals.setFormValue(this._input.value);
			this.dispatchEvent(
				new Event("change", { bubbles: true, composed: true }),
			);
		});
	}

	get input(): HTMLInputElement {
		return this._input;
	}

	get value(): string {
		return this._input.value;
	}

	set value(val: string) {
		this._input.value = val;
		this._internals.setFormValue(val);
	}

	get disabled(): boolean {
		return this._input.disabled;
	}

	set disabled(val: boolean) {
		this._input.disabled = val;
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
				this._label.textContent = newVal ?? "";
				break;
			case "disabled":
				this._input.disabled = newVal !== null;
				break;
			case "value":
				this._input.value = newVal ?? "";
				this._internals.setFormValue(newVal ?? "");
				break;
			case "aria-required":
			case "aria-label":
			case "aria-describedby":
				if (newVal !== null) {
					this._input.setAttribute(attrName, newVal);
				} else {
					this._input.removeAttribute(attrName);
				}
				break;
			default:
				if (newVal !== null) {
					this._input.setAttribute(attrName, newVal);
				} else {
					this._input.removeAttribute(attrName);
				}
				break;
		}
	}
}

customElements.define("app-input", AppInput);

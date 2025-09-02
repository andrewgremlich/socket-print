import { formContainerStyle } from "./style";

export class Dialog extends HTMLElement {
	dialog: HTMLDialogElement;
	id: string;
	form: HTMLFormElement;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `<style>
      ${formContainerStyle}
      </style>`;
	}

	attachHTML(strings: TemplateStringsArray, ...args: string[]) {
		const html = String.raw(strings, ...args);
		this.shadowRoot.innerHTML += html;

		this.dialog = this.shadowRoot.getElementById(this.id) as HTMLDialogElement;
	}

	show() {
		if (!this.dialog.open) {
			this.dialog.showModal();
		}
	}

	hide() {
		if (this.dialog.open) {
			this.dialog.close();
		}
	}

	connectedCallback() {
		if (this.dialog) {
			this.dialog.addEventListener("click", ({ target }) => {
				if (this.dialog.open && target === this.dialog) {
					this.dialog.close();
				}
			});
		}
	}
}

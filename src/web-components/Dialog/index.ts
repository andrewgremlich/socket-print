import styles from "./Dialog.css?inline";

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

export class Dialog extends HTMLElement {
	dialog: HTMLDialogElement;
	id: string;
	form: HTMLFormElement;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [sheet];
	}

	attachHTML(html: string, extraStyles?: CSSStyleSheet) {
		if (extraStyles) {
			this.shadowRoot.adoptedStyleSheets = [
				...this.shadowRoot.adoptedStyleSheets,
				extraStyles,
			];
		}
		this.shadowRoot.innerHTML += html;

		this.dialog = this.shadowRoot.getElementById(this.id) as HTMLDialogElement;
	}

	show() {
		if (!this.dialog.open) {
			this.dialog.showModal();
			if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				this.dialog.animate([{ opacity: 0 }, { opacity: 1 }], {
					duration: 250,
					easing: "ease-in-out",
					fill: "forwards",
				});
			}
			const firstFocusable = this.dialog.querySelector<HTMLElement>(
				'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			if (firstFocusable) {
				firstFocusable.focus();
			}
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

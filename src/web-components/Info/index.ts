import { version } from "pkg";

import { Dialog } from "../Dialog";
import styles from "./Info.css?inline";
import template from "./Info.html?raw";

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

export class Info extends Dialog {
	constructor() {
		super();
		this.id = "infoDialog";

		const html = template
			.replace("{{version}}", version)
			.replace("{{year}}", new Date().getFullYear().toString());

		this.attachHTML(html, sheet);
	}

	async showSettings() {
		this.show();
	}
}

customElements.define("app-info", Info);

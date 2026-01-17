import { version } from "pkg";

import { Dialog } from "../Dialog";

export class Info extends Dialog {
	constructor() {
		super();
		this.id = "infoDialog";
		this.attachHTML`
		  <dialog id="${this.id}">
		    <h3>Application Info</h3>
          <p>Version: ${version}</p>
          <p>Software Engineer: <strong><a href="https://gremlich.xyz" target="_blank">Andrew Gremlich</a></strong></p>
          <p>© Provel Inc ${new Date().getFullYear().toString()}</p>
          <p><a href="/licenses.html" target="_blank">License Info</a></p>
		  </dialog>
		`;
	}

	async showSettings() {
		this.show();
	}
}

customElements.define("app-info", Info);

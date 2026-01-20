import { version } from "pkg";

import { Dialog } from "../Dialog";

export class Info extends Dialog {
	constructor() {
		super();
		this.id = "infoDialog";
		this.attachHTML`
		  <dialog id="${this.id}" aria-labelledby="infoTitle">
		    <h3 id="infoTitle">Application Info</h3>
          <p>Version: ${version}</p>
          <p>Software Engineer: <strong><a href="https://gremlich.xyz" target="_blank" rel="noopener noreferrer">Andrew Gremlich<span class="visually-hidden"> (opens in new tab)</span></a></strong></p>
          <p>© Provel Inc ${new Date().getFullYear().toString()}</p>
          <p><a href="/licenses.html" target="_blank" rel="noopener noreferrer">License Info<span class="visually-hidden"> (opens in new tab)</span></a></p>
		  </dialog>
		  <style>
		    .visually-hidden {
		      position: absolute;
		      width: 1px;
		      height: 1px;
		      padding: 0;
		      margin: -1px;
		      overflow: hidden;
		      clip: rect(0, 0, 0, 0);
		      white-space: nowrap;
		      border: 0;
		    }
		  </style>
		`;
	}

	async showSettings() {
		this.show();
	}
}

customElements.define("app-info", Info);

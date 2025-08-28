import { version } from "pkg";
import { Dialog } from "../Dialog";

export class AppInfo extends Dialog {
	constructor() {
		super();
		this.id = "appInfoDialog";
		this.attachHTML`
      <dialog id="${this.id}">
        <h3>Application Info</h3>
        <p>Version: ${version}</p>
        <p>Made by <strong><a href="https://gremlich.xyz" target="_blank">Andrew Gremlich</a></strong></p>
      </dialog>
    `;
	}
}

customElements.define("app-info", AppInfo);

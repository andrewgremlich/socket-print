import { version } from "package.json";

export class AppInfo extends HTMLElement {
	dialog: HTMLDialogElement;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
      <style>
      dialog {
        z-index: 9999;
        border: none;
        border-radius: 15px;
        background-color: #444;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        padding: 20px 30px !important;
      }

      dialog::backdrop {
        background: rgba(0,0,0,0.3);
      }

      dialog h3 {
        margin: 0;
        color: #fff;
      }

      dialog p {
        color: #ccc;
      }
      
      dialog a {
        color: #1e90ff;
        text-underline-offset: 5px;
        text-underline-thickness: 2px;
        text-decoration-style: dashed;
        transition: color 0.3s ease;

        &:hover {
          color: #fff;
        }
      }
      </style>
      <dialog id="appInfoDialog">
        <h3>Application Info</h3>
        <p>Version: ${version}</p>
        <p>Made by <strong><a href="https://gremlich.xyz" target="_blank">Andrew Gremlich</a></strong></p>
      </dialog>
    `;
		this.dialog = this.shadowRoot.getElementById(
			"appInfoDialog",
		) as HTMLDialogElement;
	}

	connectedCallback() {
		this.addEventListener("click", this.toggleDialog.bind(this));
	}

	toggleDialog() {
		if (this.dialog.open) {
			this.dialog.close();
		} else {
			this.dialog.showModal();
		}
	}
}

customElements.define("app-info", AppInfo);

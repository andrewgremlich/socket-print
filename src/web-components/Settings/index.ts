import { version } from "pkg";
import {
	getExtrusionAdjustment,
	getLineWidthAdjustment,
	getStartingCupLayerHeight,
	setExtrusionAdjustment,
	setLineWidthAdjustment,
	setStartingCupLayerHeight,
} from "@/db/appSettingsDbActions";
import { Dialog } from "../Dialog";

export class Settings extends Dialog {
	cancelButton: HTMLButtonElement;

	constructor() {
		super();
		this.id = "settingsDialog";
		this.attachHTML`
		  <dialog id="${this.id}">
		    <h3>Settings</h3>
        	<form id="settingsForm" method="dialog">
            <label for="startingCupLayerHeight">Starting Cup Layer Height</label>
            <input type="number" id="startingCupLayerHeight" name="startingCupLayerHeight" step="0.1" min="1" max="4" />

            <label for="extrusionAdjustment">Extrusion Adjustment</label>
            <input type="number" id="extrusionAdjustment" name="extrusionAdjustment" step="0.1" min="1" max="12" />

            <label for="lineWidthAdjustment">Line Width Adjustment</label>
            <input type="number" id="lineWidthAdjustment" name="lineWidthAdjustment" step="0.1" min="1" max="2" />

            <input type="submit" value="Save" class="button" id="saveSettings" />
            <input type="button" value="Cancel" class="button" id="cancelSettings" />
					</form>
					<div id="appInfo">
						<h4>Application Info</h4>
						<p>Version: ${version}</p>
						<p>Made by <strong><a href="https://gremlich.xyz" target="_blank">Andrew Gremlich</a></strong></p>
					</div>
		  </dialog>
		`;

		this.form = this.shadowRoot.getElementById(
			"settingsForm",
		) as HTMLFormElement;
		this.cancelButton = this.shadowRoot.getElementById(
			"cancelSettings",
		) as HTMLButtonElement;

		this.dialogEvents();
	}

	async showSettings() {
		await this.loadDataIntoForm();
		this.show();
	}

	dialogEvents() {
		this.form.addEventListener("submit", () => this.saveSettings());

		this.cancelButton.addEventListener("click", () => this.hide());

		this.dialog.addEventListener("close", () => this.hide());
	}

	async saveSettings() {
		const formData = new FormData(this.form);
		const settings = Object.fromEntries(formData.entries());

		// Save settings to the database
		await Promise.all([
			setStartingCupLayerHeight(+settings.startingCupLayerHeight),
			setLineWidthAdjustment(+settings.lineWidthAdjustment),
			setExtrusionAdjustment(+settings.extrusionAdjustment),
		]);
	}

	async loadDataIntoForm() {
		const [startingCupLayerHeight, lineWidthAdjustment, extrusionAdjustment] =
			await Promise.all([
				getStartingCupLayerHeight(),
				getLineWidthAdjustment(),
				getExtrusionAdjustment(),
			]);

		const settingKeys = [
			"startingCupLayerHeight",
			"lineWidthAdjustment",
			"extrusionAdjustment",
		];

		for (const key of settingKeys) {
			const input = this.form.elements.namedItem(key) as HTMLInputElement;
			if (!input) continue;
			switch (key) {
				case "startingCupLayerHeight":
					input.value = startingCupLayerHeight.toString();
					break;
				case "lineWidthAdjustment":
					input.value = lineWidthAdjustment.toString();
					break;
				case "extrusionAdjustment":
					input.value = extrusionAdjustment.toString();
					break;
			}
		}
	}
}

customElements.define("app-settings", Settings);

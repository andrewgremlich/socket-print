import {
	getExtrusionAdjustment,
	getLineWidthAdjustment,
	getStartingCupLayerHeight,
} from "@/db/appSettingsDbActions";
import { Dialog } from "../Dialog";

export class Settings extends Dialog {
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
            <input type="number" id="extrusionAdjustment" name="extrusionAdjustment" step="1" min="1" max="12" />

            <label for="lineWidthAdjustment">Line Width Adjustment</label>
            <input type="number" id="lineWidthAdjustment" name="lineWidthAdjustment" step="0.1" min="1" max="2" />

            <input type="submit" value="Save" class="button" id="saveSettings" />
            <input type="button" value="Cancel" class="button" id="cancelSettings" />
        </form>
		  </dialog>
		`;

		this.form = this.shadowRoot.getElementById(
			"settingsForm",
		) as HTMLFormElement;

		this.loadDataIntoForm();
	}

	formChangeEvents() {
		this.form.addEventListener("change", () => {
			const formData = new FormData(this.form);
			for (const [key, value] of formData.entries()) {
				console.log({ key, value });
			}
		});
	}

	async loadDataIntoForm() {
		const [startingCupLayerHeight, lineWidthAdjustment, extrusionAdjustment] =
			await Promise.all([
				getStartingCupLayerHeight(),
				getLineWidthAdjustment(),
				getExtrusionAdjustment(),
			]);

		const formData = new FormData(this.form);

		for (const [key] of formData.entries()) {
			const input = this.form.elements.namedItem(key) as HTMLInputElement;

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

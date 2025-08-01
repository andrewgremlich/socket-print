import { appendMaterialProfiles } from "@/db/appendMaterialProfiles";
import { loadActiveMaterialProfile } from "@/db/loadMainDataForm";
import {
	addNewMaterialProfile,
	getActiveMaterialProfile,
	updateMaterialProfile,
} from "@/db/materialProfiles";
import type { MaterialProfile } from "@/db/types";
import { formContainerStyle } from "./style";

export class MaterialProfileForm extends HTMLElement {
	dialog: HTMLDialogElement;
	form: HTMLFormElement;
	formTitle: HTMLElement;
	cancelButton: HTMLElement;
	host: Element;

	editMaterialProfile: MaterialProfile;

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
      <style>
          ${formContainerStyle}
      </style>
      <dialog id="materialDialog">
        <h3 id="formTitle"></h3>
        <form id="materialForm" method="dialog">
            <label for="materialProfileName">Material Profile Name</label>
            <input type="text" id="materialProfileName" name="materialProfileName" required />
            
            <label for="nozzleTemp">Nozzle Temp in C</label>
            <input type="number" value="200" name="nozzleTemp" id="nozzleTemp" required />
            
            <label for="cupTemp">Cup Temp in C</label>
            <input type="number" value="130" name="cupTemp" id="cupTemp" required />
            
            <label for="shrinkFactor">Shrink Factor %</label>
            <input type="number" step="0.1" value="2.6" name="shrinkFactor" id="shrinkFactor" required />
            
            <label for="outputFactor">Output Factor</label>
            <input type="number" min="0.1" step="0.1" value="1" name="outputFactor" id="outputFactor" required />

            <label for="secondsPerLayer">Seconds Per Layer</label>
            <input type="number" value="8" name="secondsPerLayer" id="secondsPerLayer" required />

            <input type="submit" value="Save" class="button" id="saveMaterialProfile" />
            <input type="button" value="Cancel" class="button" id="cancelMaterialProfile" />
        </form>
      </dialog>
    `;

		this.dialog = this.shadowRoot.getElementById(
			"materialDialog",
		) as HTMLDialogElement;
		this.form = this.shadowRoot.getElementById(
			"materialForm",
		) as HTMLFormElement;
		this.formTitle = this.shadowRoot.getElementById("formTitle") as HTMLElement;
		this.cancelButton = this.shadowRoot.getElementById(
			"cancelMaterialProfile",
		) as HTMLElement;
	}

	connectedCallback() {
		this.form.addEventListener("submit", () => this.saveProfile());

		this.cancelButton.addEventListener("click", () => this.hideForm());

		this.dialog.addEventListener("close", () => this.hideForm());

		this.dialog.addEventListener("click", ({ target, currentTarget }) => {
			if (target === currentTarget) {
				this.hideForm();
			}
		});
	}

	async showForm(type: "new" | "edit") {
		this.formTitle.textContent =
			type === "new" ? "Add Material Profile" : "Edit Material Profile";

		if (type === "edit") {
			const profile = await getActiveMaterialProfile();
			this.editMaterialProfile = profile;
			(
				this.form.elements.namedItem("materialProfileName") as HTMLInputElement
			).value = profile.name;
			(this.form.elements.namedItem("nozzleTemp") as HTMLInputElement).value =
				profile.nozzleTemp.toString();
			(this.form.elements.namedItem("cupTemp") as HTMLInputElement).value =
				profile.cupTemp.toString();
			(this.form.elements.namedItem("shrinkFactor") as HTMLInputElement).value =
				profile.shrinkFactor.toString();
			(this.form.elements.namedItem("outputFactor") as HTMLInputElement).value =
				profile.outputFactor.toString();
			(
				this.form.elements.namedItem("secondsPerLayer") as HTMLInputElement
			).value = profile.secondsPerLayer.toString();
		} else {
			this.form.reset();
		}

		if (!this.dialog.open) {
			this.dialog.showModal();
		}
	}

	async saveProfile() {
		const materialProfileDisplay = new FormData(this.form);
		const {
			materialProfileName,
			nozzleTemp,
			cupTemp,
			shrinkFactor,
			outputFactor,
			secondsPerLayer,
		} = Object.fromEntries(materialProfileDisplay.entries());

		const profile = {
			name: materialProfileName as string,
			nozzleTemp: Number.parseFloat(nozzleTemp as string),
			cupTemp: Number.parseFloat(cupTemp as string),
			shrinkFactor: Number.parseFloat(shrinkFactor as string),
			outputFactor: Number.parseFloat(outputFactor as string),
			secondsPerLayer: Number.parseFloat(secondsPerLayer as string),
		};

		if (this.editMaterialProfile) {
			await updateMaterialProfile({
				...this.editMaterialProfile,
				...profile,
			});
		} else {
			await addNewMaterialProfile(profile);
		}

		await appendMaterialProfiles();
		await loadActiveMaterialProfile();
	}

	hideForm() {
		this.form.reset();

		if (this.dialog.open) {
			this.dialog.close();
		}
	}
}

customElements.define("material-profile-form", MaterialProfileForm);

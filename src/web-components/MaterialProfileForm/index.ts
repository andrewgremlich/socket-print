import { appendMaterialProfiles } from "@/db/appendMaterialProfiles";
import {
	addNewMaterialProfile,
	getActiveMaterialProfile,
	updateMaterialProfile,
} from "@/db/materialProfiles";
import type { MaterialProfile } from "@/db/types";

import { loadActiveMaterialProfile } from "@/db/loadMainDataForm";
import { formContainerStyle } from "./style";

export class MaterialProfileForm extends HTMLElement {
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
      <h3 id="formTitle"></h3>
      <form id="materialForm">
          <label for="materialProfileName">Material Profile Name</label>
          <input type="text" id="materialProfileName" name="materialProfileName" required />
          
          <label for="nozzleTemp">Nozzle Temp in C</label>
          <input type="number" value="200" name="nozzleTemp" id="nozzleTemp" required />
          
          <label for="cupTemp">Cup Temp in C</label>
          <input type="number" value="130" name="cupTemp" id="cupTemp" required />
          
          <label for="shrinkFactor">Shrink Factor %</label>
          <input type="number" step="0.1" value="2.6" name="shrinkFactor" id="shrinkFactor" required />
          
          <label for="outputFactor">Output Factor</label>
          <input type="number" value="1" name="outputFactor" id="outputFactor" required />
          
          <input type="submit" value="Save" class="button" id="saveMaterialProfile" />
          <input type="button" value="Cancel" class="button" id="cancelMaterialProfile" />
      </form>
    `;

		this.form = this.shadowRoot.getElementById(
			"materialForm",
		) as HTMLFormElement;
		this.formTitle = this.shadowRoot.getElementById("formTitle") as HTMLElement;
		this.cancelButton = this.shadowRoot.getElementById(
			"cancelMaterialProfile",
		) as HTMLElement;
		this.host = this.shadowRoot.host;

		this.shadowRoot.host.classList.add("hide");

		this.form.addEventListener("submit", (e) => this.saveProfile(e));
		this.cancelButton.addEventListener("click", () => this.hideForm());
	}

	async showForm(type: "new" | "edit") {
		this.formTitle.textContent =
			type === "new" ? "Add Material Profile" : "Edit Material Profile";

		if (type === "edit") {
			const profile = await getActiveMaterialProfile();

			console.log("Active Material Profile", profile);

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
		} else {
			this.form.reset();
		}

		this.host.classList.remove("hide");
	}

	async saveProfile(event: Event) {
		event.preventDefault();

		const materialProfileDisplay = new FormData(this.form);
		const {
			materialProfileName,
			nozzleTemp,
			cupTemp,
			shrinkFactor,
			outputFactor,
		} = Object.fromEntries(materialProfileDisplay.entries());

		const profile = {
			name: materialProfileName as string,
			nozzleTemp: Number.parseFloat(nozzleTemp as string),
			cupTemp: Number.parseFloat(cupTemp as string),
			shrinkFactor: Number.parseFloat(shrinkFactor as string),
			outputFactor: Number.parseFloat(outputFactor as string),
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

		this.dispatchEvent(
			new CustomEvent("material-profile-saved", {
				detail: profile,
				bubbles: true,
				composed: true,
			}),
		);

		this.hideForm();
	}

	hideForm() {
		this.form.reset();
		this.host.classList.add("hide");
	}
}

customElements.define("material-profile-form", MaterialProfileForm);

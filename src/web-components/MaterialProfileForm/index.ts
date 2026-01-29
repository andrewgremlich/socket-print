import { appendMaterialProfiles } from "@/db/appendMaterialProfiles";
import { loadActiveMaterialProfileForm } from "@/db/loadDataIntoForms";
import {
	addNewMaterialProfile,
	getActiveMaterialProfile,
	updateMaterialProfile,
} from "@/db/materialProfilesDbActions";
import type { MaterialProfile } from "@/db/types";
import { Dialog } from "../Dialog";

export class MaterialProfileForm extends Dialog {
	formTitle: HTMLElement;
	cancelButton: HTMLElement;
	host: Element;
	editMaterialProfile: MaterialProfile;
	materialProfileName: HTMLInputElement;

	constructor() {
		super();
		this.id = "materialDialog";
		this.attachHTML`
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
      <dialog id="${this.id}" aria-labelledby="formTitle">
        <h3 id="formTitle" aria-live="polite"></h3>
        <form id="materialForm" method="dialog">
			<input type="hidden" id="materialProfileId" name="materialProfileId" placeholder="Material Profile ID" />

            <label for="materialProfileName">Material Profile Name</label>
            <input type="text" id="materialProfileName" name="materialProfileName" required aria-describedby="nameReadOnlyHint" />
            <span id="nameReadOnlyHint" class="visually-hidden"></span>

            <label for="nozzleTemp">Nozzle Temp (C)</label>
            <input type="number" id="nozzleTemp" name="nozzleTemp" value="200" min="160" max="260" required />

            <label for="cupTemp">Cup Temp (C)</label>
            <input type="number" id="cupTemp" name="cupTemp" value="190" min="140" max="200" required />

            <label for="shrinkFactor">Shrink Factor (%)</label>
            <input type="number" id="shrinkFactor" name="shrinkFactor" value="2.6" min="0.1" max="4.0" step="0.01" required />

            <label for="outputFactor">Output Factor</label>
            <input type="number" id="outputFactor" name="outputFactor" value="1" min="0.9" max="1.1" step="0.01" required />

			<label for="gramsPerRevolution">Grams Per Revolution</label>
            <input type="number" id="gramsPerRevolution" name="gramsPerRevolution" value="0.2" min="0.1" max="0.3" step="0.01" required />

			<label for="density">Density (g/cm³)</label>
            <input type="number" id="density" name="density" value="0.0009" min="0.0005" max="0.0020" step="0.0001" required />

            <input type="submit" id="saveMaterialProfile" value="Save" class="button" />
            <input type="button" id="cancelMaterialProfile" value="Cancel" class="button" />
        </form>
      </dialog>
    `;

		this.form = this.shadowRoot.getElementById(
			"materialForm",
		) as HTMLFormElement;
		this.formTitle = this.shadowRoot.getElementById("formTitle") as HTMLElement;
		this.cancelButton = this.shadowRoot.getElementById(
			"cancelMaterialProfile",
		) as HTMLElement;
		this.materialProfileName = this.shadowRoot.getElementById(
			"materialProfileName",
		) as HTMLInputElement;

		this.dialogEvents();
	}

	dialogEvents() {
		this.form.addEventListener("submit", () => this.saveProfile());

		this.cancelButton.addEventListener("click", () => this.hide());

		this.dialog.addEventListener("close", () => this.hide());
	}

	async showForm(type: "new" | "edit") {
		this.formTitle.textContent =
			type === "new" ? "Add Material Profile" : "Edit Material Profile";

		const nameHint = this.shadowRoot.getElementById("nameReadOnlyHint");

		if (type === "edit") {
			const profile = await getActiveMaterialProfile();

			this.materialProfileName.readOnly = true;
			this.materialProfileName.setAttribute("aria-readonly", "true");
			if (nameHint)
				nameHint.textContent = "Name cannot be changed when editing";
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
				this.form.elements.namedItem("materialProfileId") as HTMLInputElement
			).value = profile.id.toString();
			(
				this.form.elements.namedItem("gramsPerRevolution") as HTMLInputElement
			).value = profile.gramsPerRevolution.toString();
			(this.form.elements.namedItem("density") as HTMLInputElement).value =
				profile.density.toString();
		} else {
			this.materialProfileName.readOnly = false;
			this.materialProfileName.removeAttribute("aria-readonly");
			if (nameHint) nameHint.textContent = "";
			this.editMaterialProfile = null;
			this.form.reset();
		}

		if (!this.dialog.open) {
			this.dialog.showModal();
		}
	}

	async saveProfile() {
		const materialProfileDisplay = new FormData(this.form);
		const {
			materialProfileId,
			materialProfileName,
			nozzleTemp,
			cupTemp,
			shrinkFactor,
			outputFactor,
			gramsPerRevolution,
			density,
		} = Object.fromEntries(materialProfileDisplay.entries());

		const profile = {
			id: +materialProfileId,
			name: materialProfileName as string,
			nozzleTemp: Number.parseFloat(nozzleTemp as string),
			cupTemp: Number.parseFloat(cupTemp as string),
			shrinkFactor: Number.parseFloat(shrinkFactor as string),
			outputFactor: Number.parseFloat(outputFactor as string),
			gramsPerRevolution: Number.parseFloat(gramsPerRevolution as string),
			density: Number.parseFloat(density as string),
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
		await loadActiveMaterialProfileForm();
	}
}

customElements.define("material-profile-form", MaterialProfileForm);

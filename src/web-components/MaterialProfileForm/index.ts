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
      <dialog id="${this.id}">
        <h3 id="formTitle"></h3>
        <form id="materialForm" method="dialog">
						<input type="hidden" name="materialProfileId" placeholder="Material Profile ID" />

            <label for="materialProfileName">Material Profile Name</label>
            <input type="text" id="materialProfileName" name="materialProfileName" required />
            
            <label for="nozzleTemp">Nozzle Temp (C)</label>
            <input type="number" min="160" max="260" value="200" name="nozzleTemp" id="nozzleTemp" required />
            
            <label for="cupTemp">Cup Temp (C)</label>
            <input type="number" min="140" max="200" value="160" name="cupTemp" id="cupTemp" required />
            
            <label for="shrinkFactor">Shrink Factor (%)</label>
            <input type="number" min="0.1" max="4.0" step="0.01" value="2.6" name="shrinkFactor" id="shrinkFactor" required />

						<label for="gramsPerRevolution">Grams Per Revolution</label>
            <input type="number" step="0.01" name="gramsPerRevolution" id="gramsPerRevolution" required min="0.1" max="0.3" />

						<label for="density">Density (g/cm³)</label>
            <input type="number" step="0.0001" name="density" id="density" required min="0.0005" max="0.0020" />

            <label for="outputFactor">Output Factor</label>
            <input type="number" min="0.9" max="1.1" step="0.01" value="1" name="outputFactor" id="outputFactor" required />

            <input type="submit" value="Save" class="button" id="saveMaterialProfile" />
            <input type="button" value="Cancel" class="button" id="cancelMaterialProfile" />
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

		if (type === "edit") {
			const profile = await getActiveMaterialProfile();

			this.materialProfileName.readOnly = true;
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

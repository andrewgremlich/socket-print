import { appendMaterialProfiles } from "@/db/appendMaterialProfiles";
import { loadActiveMaterialProfileForm } from "@/db/loadDataIntoForms";
import {
	addNewMaterialProfile,
	getActiveMaterialProfile,
	updateMaterialProfile,
} from "@/db/materialProfilesDbActions";
import type { MaterialProfile } from "@/db/types";
import { Dialog } from "../Dialog";
import styles from "./MaterialProfileForm.css?inline";
import template from "./MaterialProfileForm.html?raw";

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

export class MaterialProfileForm extends Dialog {
	formTitle: HTMLElement;
	cancelButton: HTMLElement;
	host: Element;
	editMaterialProfile: MaterialProfile;
	materialProfileName: HTMLInputElement;

	constructor() {
		super();
		this.id = "materialDialog";
		this.attachHTML(template, sheet);

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

import { getFormKeyValues } from "./keyValueSettings";
import { getActiveMaterialProfile } from "./materialProfiles";

export async function loadMainDataForm() {
	const appSettings = await getFormKeyValues();

	for (const { name, value } of Object.values(appSettings)) {
		if (name === "lockPosition") {
			const leftRadio = document.getElementById(
				"lockPositionLeft",
			) as HTMLInputElement | null;
			const rightRadio = document.getElementById(
				"lockPositionRight",
			) as HTMLInputElement | null;
			if (leftRadio && rightRadio) {
				leftRadio.checked = value === "left";
				rightRadio.checked = value === "right";
			}
			continue;
		}

		const input = document.querySelector(
			`[name="${name}"]`,
		) as HTMLInputElement | null;

		if (input && input.type === "checkbox") {
			input.checked = value as boolean;
		} else if (input) {
			input.value = `${value}`;
		} else {
			console.warn(`Input with name ${name} not found`);
		}
	}
}

export async function loadActiveMaterialProfile() {
	const activeMaterialProfile = await getActiveMaterialProfile();

	for (const key of Object.keys(activeMaterialProfile)) {
		const input = document.querySelector(`#${key}Display`);

		if (input) {
			input.textContent = `${activeMaterialProfile[key as keyof typeof activeMaterialProfile]}`;
		}
	}

	document
		.querySelector(`[value="${activeMaterialProfile.name}"]`)
		?.setAttribute("selected", "true");
}

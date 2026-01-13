import { leftRadio, rightRadio } from "@/utils/htmlElements";
import { getFormKeyValues } from "./formValuesDbActions";
import { getActiveMaterialProfile } from "./materialProfilesDbActions";
import type { CupSize } from "./types";

export async function loadMainDataForm() {
	const appSettings = await getFormKeyValues();

	for (const { name, value } of Object.values(appSettings)) {
		if (name === "lockPosition") {
			leftRadio.checked = value === "left";
			rightRadio.checked = value === "right";
			continue;
		}

		if (name === "cupSize") {
			const casted = value as CupSize;
			(document.querySelector(`[name="${name}"]`) as HTMLSelectElement).value =
				casted.name;

			continue;
		}

		const input = document.querySelector(
			`[name="${name}"]`,
		) as HTMLInputElement | null;

		if (input) {
			input.value = `${value}`;
		} else {
			console.warn(`Input with name ${name} not found`);
		}
	}
}

export async function loadActiveMaterialProfileForm() {
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

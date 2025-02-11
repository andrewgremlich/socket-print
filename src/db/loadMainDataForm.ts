import { appForm } from "@/utils/htmlElements";

import { getAppSettings } from "./appSettings";
import { getActiveMaterialProfile } from "./materialProfiles";

export async function loadMainDataForm() {
	const appSettings = await getAppSettings();

	for (const { name, value } of Object.values(appSettings)) {
		const input = appForm.querySelector(
			`[name="${name}"]`,
		) as HTMLInputElement | null;

		if (input) {
			input.value = `${value}`;
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
}

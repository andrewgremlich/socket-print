import {
	generateGCodeButton,
	printerFileInput,
	printerFileInputLabel,
} from "@/utils/htmlElements";
import { getAppSettings, getSendToFile } from "./appSettings";
import { getActiveMaterialProfile } from "./materialProfiles";

export async function loadMainDataForm() {
	const appSettings = await getAppSettings();

	for (const { name, value } of Object.values(appSettings)) {
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
}

export const triggerSendToFileEffect = async () => {
	const sendToFile = await getSendToFile();

	if (sendToFile) {
		generateGCodeButton.disabled = false;
		generateGCodeButton.classList.remove("hide");

		printerFileInput.disabled = true;
		printerFileInputLabel.classList.add("hide");
	} else {
		printerFileInput.disabled = false;
		printerFileInputLabel.classList.remove("hide");

		generateGCodeButton.disabled = true;
		generateGCodeButton.classList.add("hide");
	}
};

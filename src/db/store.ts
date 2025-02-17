import { appForm, restoreDefaultsButton } from "@/utils/htmlElements";

import { setAllAppSettings } from "./appSettings";
import { appendMaterialProfiles } from "./appendMaterialProfiles";
import {
	defaultSettingNames,
	materialProfileDefaults,
	settingsDefaults,
} from "./checkDb";
import {
	loadActiveMaterialProfile,
	loadMainDataForm,
	triggerSendToFileEffect,
} from "./loadMainDataForm";
import type { ProvelPrintSettings } from "./types";

const initData = async () => {
	await materialProfileDefaults();
	await settingsDefaults();
	await appendMaterialProfiles();
	await loadMainDataForm();
	await loadActiveMaterialProfile();
	triggerSendToFileEffect();
};

await initData();

restoreDefaultsButton.addEventListener("click", async () => {
	await setAllAppSettings(defaultSettingNames);
	await initData();
});

appForm.addEventListener("change", async (event) => {
	event.preventDefault();

	const storeForm = new FormData(appForm);
	const storeFormEntries = Object.fromEntries(
		storeForm.entries(),
	) as unknown as ProvelPrintSettings;

	await setAllAppSettings(storeFormEntries);

	const name = (event.target as HTMLInputElement).name;

	if (name === "activeMaterialProfile") {
		await loadActiveMaterialProfile();
	}
});

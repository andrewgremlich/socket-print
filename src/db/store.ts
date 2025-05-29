import { appForm, restoreDefaultsButton } from "@/utils/htmlElements";

import { setAllAppSettings } from "./appSettings";
import { appendMaterialProfiles } from "./appendMaterialProfiles";
import { makeMaterialProfileDefaults, settingsDefaults } from "./dbDefaults";
import {
	loadActiveMaterialProfile,
	loadMainDataForm,
} from "./loadMainDataForm";
import type { MaterialProfile, ProvelPrintSettings } from "./types";

const defaultSettingNames: ProvelPrintSettings = {
	ipAddress: "",
	lockPosition: "right",
	cupSize: "93x25",
	nozzleSize: 5,
	layerHeight: 1,
	activeMaterialProfile: "cp1",
	lockDepth: 13,
	circularSegments: 128,
};

const materialProfileDefaults: Omit<MaterialProfile, "id"> = {
	name: "cp1",
	nozzleTemp: 200,
	cupTemp: 130,
	shrinkFactor: 2.6,
	outputFactor: 1.0,
	feedrate: 2250,
};

export const initData = async () => {
	await makeMaterialProfileDefaults(materialProfileDefaults);
	await settingsDefaults(defaultSettingNames);
	await appendMaterialProfiles();
	await loadMainDataForm();
	await loadActiveMaterialProfile();
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

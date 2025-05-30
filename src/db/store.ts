import { appForm, restoreDefaultsButton } from "@/utils/htmlElements";

import { appendMaterialProfiles } from "./appendMaterialProfiles";
import {
	makeDefaultsKeyValues,
	makeMaterialProfileDefaults,
} from "./dbDefaults";
import { resetAllDefaultKeyValues } from "./keyValueSettings";
import {
	loadActiveMaterialProfile,
	loadMainDataForm,
} from "./loadMainDataForm";
import { EntityEnum, type FormValues, type ProvelPrintSettings } from "./types";

const defaultFormValues: FormValues = {
	ipAddress: "",
	lockPosition: "right",
	cupSize: "93x25",
	nozzleSize: 5,
	layerHeight: 1,
	activeMaterialProfile: "cp1",
};

const defaultSettingNames: ProvelPrintSettings = {
	lockDepth: 13,
	circularSegments: 128,
};

const initData = async () => {
	await Promise.all([
		makeMaterialProfileDefaults(),
		makeDefaultsKeyValues(EntityEnum.formValues, defaultFormValues),
		makeDefaultsKeyValues(EntityEnum.appSettings, defaultSettingNames),
	]);
	await Promise.all([
		appendMaterialProfiles(),
		loadMainDataForm(),
		loadActiveMaterialProfile(),
	]);
};

await initData();

restoreDefaultsButton.addEventListener("click", async () => {
	await Promise.all([
		makeDefaultsKeyValues(EntityEnum.formValues, defaultFormValues),
		makeDefaultsKeyValues(EntityEnum.appSettings, defaultSettingNames),
	]);
	await initData();
});

appForm.addEventListener("change", async (event) => {
	event.preventDefault();

	const storeForm = new FormData(appForm);
	const storeFormEntries = Object.fromEntries(
		storeForm.entries(),
	) as unknown as ProvelPrintSettings;

	await resetAllDefaultKeyValues(EntityEnum.formValues, storeFormEntries);

	const name = (event.target as HTMLInputElement).name;

	if (name === "activeMaterialProfile") {
		await loadActiveMaterialProfile();
	}
});

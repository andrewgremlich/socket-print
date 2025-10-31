import { appForm } from "@/utils/htmlElements";

import { appendMaterialProfiles } from "./appendMaterialProfiles";
import {
	makeDefaultsKeyValues,
	makeMaterialProfileDefaults,
} from "./dbDefaults";
import { setFormValues } from "./formValuesDbActions";
import {
	loadActiveMaterialProfileForm,
	loadMainDataForm,
} from "./loadDataIntoForms";
import { EntityEnum, type FormValues, type ProvelPrintSettings } from "./types";

const defaultFormValues: FormValues = {
	ipAddress: "",
	lockPosition: "right",
	cupSize: "84x38",
	nozzleSize: 5,
	layerHeight: 1,
	activeMaterialProfile: "cp1",
};

const defaultSettingNames: ProvelPrintSettings = {
	lockDepth: 13,
	circularSegments: 128,
	translateX: 0,
	translateY: 0,
	translateZ: 0,
	rotateCoronal: 0,
	rotateSagittal: 0,
	rotateTransverse: 0,
	startingCupLayerHeight: 2,
	lineWidthAdjustment: 1.2,
	testCylinderHeight: 50,
	testCylinderDiameter: 70,
	secondsPerLayer: 8,
	ePerRevolution: 31.3,
};

const initData = async () => {
	await makeMaterialProfileDefaults();
	await makeDefaultsKeyValues(EntityEnum.formValues, defaultFormValues);
	await makeDefaultsKeyValues(EntityEnum.appSettings, defaultSettingNames);
	await appendMaterialProfiles();
	await loadMainDataForm();
	await loadActiveMaterialProfileForm();
};

await initData();

appForm.addEventListener("change", async (event) => {
	event.preventDefault();

	const storeForm = new FormData(appForm);
	const storeFormEntries = Object.fromEntries(
		storeForm.entries(),
	) as unknown as ProvelPrintSettings;

	await setFormValues(storeFormEntries);

	const name = (event.target as HTMLInputElement).name;

	if (name === "activeMaterialProfile") {
		await loadActiveMaterialProfileForm();
	}
});

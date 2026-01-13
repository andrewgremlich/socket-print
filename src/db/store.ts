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
import {
	type CupSize,
	EntityEnum,
	type FormValues,
	type ProvelPrintSettings,
} from "./types";

const defaultCupSize: CupSize = {
	innerDiameter: 65,
	outerDiameter: 84,
	height: 38,
	name: "84x38",
};

const smallCupSize: CupSize = {
	innerDiameter: 65,
	outerDiameter: 84,
	height: 25,
	name: "84x25",
};

const defaultFormValues: FormValues = {
	ipAddress: "",
	lockPosition: "right",
	cupSize: defaultCupSize,
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
	testCylinderInnerDiameter: 70,
	secondsPerLayer: 12,
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
	const storeFormEntries = Object.fromEntries(storeForm.entries());

	const { cupSize, ...rest } = storeFormEntries;
	const cupSizeHydrated = {
		cupSize: [defaultCupSize, smallCupSize].find(
			(size) => size.name === cupSize,
		),
		...rest,
	};

	await setFormValues(cupSizeHydrated);

	const name = (event.target as HTMLInputElement).name;

	if (name === "activeMaterialProfile") {
		await loadActiveMaterialProfileForm();
	}
});

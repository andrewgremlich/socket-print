import { connectToPrinter } from "@/3d/sendGCodeFile";
import {
	appForm,
	ipAddressFailure,
	ipAddressSuccess,
	restoreDefaultsButton,
} from "@/utils/htmlElements";

import { getIpAddress, setAllAppSettings } from "./appSettings";
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

const ipAddress = await getIpAddress();

if (ipAddress.length > 0 && import.meta.env.MODE !== "development") {
	connectToPrinter(ipAddress)
		.then(() => {
			console.log("successful connection");
			ipAddressFailure.classList.toggle("hide");
			ipAddressSuccess.classList.toggle("hide");
		})
		.catch((error) => {
			console.error("CAUGHT:", error);
		});
}

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
		loadActiveMaterialProfile();
	}
});

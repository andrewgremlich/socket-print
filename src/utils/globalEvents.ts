import hotkeys from "hotkeys-js";

import { appendMaterialProfiles } from "@/db/appendMaterialProfiles";
import { saveActiveMaterialProfile } from "@/db/formValuesDbActions";
import { loadActiveMaterialProfileForm } from "@/db/loadDataIntoForms";
import {
	deleteActiveMaterialProfile,
	getMaterialProfiles,
} from "@/db/materialProfilesDbActions";
import {
	handleIpAddressChange,
	printerConnection,
} from "./handlePrinterConnection";
import {
	infoDialog,
	ipAddressInput,
	materialProfileForm,
	menuBarComponent,
	settingsDialog,
} from "./htmlElements";

hotkeys("ctrl+shift+r", (_event, handler) => {
	switch (handler.key) {
		case "ctrl+shift+r":
			location.reload();
			break;
		default:
			break;
	}
});

ipAddressInput.addEventListener("input", handleIpAddressChange);
setTimeout(async () => await printerConnection(), 1000);

menuBarComponent.addEventListener("menu-settings", async () => {
	await settingsDialog.showSettings();
});

menuBarComponent.addEventListener("menu-info", async () => {
	await infoDialog.showSettings();
});

menuBarComponent.addEventListener("menu-add-material-profile", () => {
	materialProfileForm.showForm("new");
});

menuBarComponent.addEventListener("menu-edit-material-profile", () => {
	materialProfileForm.showForm("edit");
});

menuBarComponent.addEventListener("menu-delete-material-profile", async () => {
	await deleteActiveMaterialProfile();

	const materialProfiles = await getMaterialProfiles();

	await saveActiveMaterialProfile(materialProfiles[0].name);
	await appendMaterialProfiles();
	await loadActiveMaterialProfileForm();
});

menuBarComponent.addEventListener("menu-help", () => {
	window.open("/help.html", "_self");
});

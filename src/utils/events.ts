import hotkeys from "hotkeys-js";

import { appendMaterialProfiles } from "@/db/appendMaterialProfiles";
import { saveActiveMaterialProfile } from "@/db/keyValueSettings";
import { loadActiveMaterialProfile } from "@/db/loadMainDataForm";
import {
	deleteActiveMaterialProfile,
	getMaterialProfiles,
} from "@/db/materialProfiles";
import {
	handleIpAddressChange,
	printerConnection,
} from "./handlePrinterConnection";
import {
	activateInfoDialog,
	addMaterialProfile,
	appInfo,
	deleteMaterialProfileButton,
	editActiveMaterialProfile,
	ipAddressInput,
	materialProfileForm,
	menuBar,
	menuBarDropdowns,
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

menuBar.addEventListener("click", (evt) => {
	const target = evt.target as HTMLElement;

	for (const dropdown of menuBarDropdowns) {
		if (dropdown !== target.nextElementSibling) {
			dropdown.classList.remove("show");
		}
	}

	if (
		target.matches(".menuBarButton") &&
		!target.classList.contains("noDropdown")
	) {
		const nextSibling = target.nextElementSibling as HTMLElement;
		nextSibling.classList.toggle("show");
	}
});

window.addEventListener("click", (evt) => {
	if (!(evt.target as HTMLElement).matches(".menuBarButton")) {
		for (const dropdown of menuBarDropdowns) {
			dropdown.classList.remove("show");
		}
	}
});

ipAddressInput.addEventListener("input", handleIpAddressChange);
setTimeout(async () => await printerConnection(), 1000);

activateInfoDialog.addEventListener("click", () => appInfo.show());

addMaterialProfile.addEventListener("click", () =>
	materialProfileForm.showForm("new"),
);

editActiveMaterialProfile.addEventListener("click", () =>
	materialProfileForm.showForm("edit"),
);

deleteMaterialProfileButton.addEventListener("click", async () => {
	await deleteActiveMaterialProfile();

	const materialProfiles = await getMaterialProfiles();

	await saveActiveMaterialProfile(materialProfiles[0].name);
	await appendMaterialProfiles();
	await loadActiveMaterialProfile();
});

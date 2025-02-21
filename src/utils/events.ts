import { connectToPrinter } from "@/3d/sendGCodeFile";

import { saveActiveMaterialProfile } from "@/db/appSettings";
import { appendMaterialProfiles } from "@/db/appendMaterialProfiles";
import { loadActiveMaterialProfile } from "@/db/loadMainDataForm";
import {
	deleteActiveMaterialProfile,
	getMaterialProfiles,
} from "@/db/materialProfiles";
import {
	addMaterialProfile,
	deleteMaterialProfileButton,
	editActiveMaterialProfile,
	ipAddressFailure,
	ipAddressInput,
	ipAddressSuccess,
	materialProfileForm,
	menuBar,
	menuBarDropdowns,
} from "./htmlElements";

menuBar.addEventListener("click", (evt) => {
	const target = evt.target as HTMLElement;

	for (const dropdown of menuBarDropdowns) {
		if (dropdown !== target.nextElementSibling) {
			dropdown.classList.remove("show");
		}
	}

	if (target.matches(".menuBarButton")) {
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

const printerConnection = async () => {
	try {
		await connectToPrinter(ipAddressInput.value);

		ipAddressFailure.classList.toggle("hide");
		ipAddressSuccess.classList.toggle("hide");

		ipAddressSuccess.spinIcon();
	} catch (error) {
		console.error("CAUGHT:", error);

		ipAddressFailure.classList.remove("hide");
		ipAddressSuccess.classList.add("hide");

		ipAddressFailure.spinIcon();
	}
};

ipAddressInput.addEventListener("input", printerConnection);

if (!import.meta.env.DEV) {
	window.addEventListener("load", printerConnection);
}

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

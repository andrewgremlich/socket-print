import { registerSW } from "virtual:pwa-register";
import type { MaterialProfile } from "@/global";

import {
	activeMaterialProfileSelect,
	cancelMaterialProfileButton,
	editMaterialProfiles,
	ipAddressFailure,
	ipAddressInput,
	ipAddressSuccess,
	menuBar,
	menuBarDropdowns,
	newMaterialProfile,
	newMaterialProfileForm,
	printerFileInput,
} from "./htmlElements";
import { appendMaterialProfiles } from "./materialProfiles";
import { connectToPrinter, sendGCodeFile } from "./sendGCodeFile";

registerSW({
	onNeedRefresh() {
		console.log("needs refresh");
	},
	onOfflineReady() {
		console.log("offline ready");
	},
});

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

printerFileInput.addEventListener("change", async () => {
	if (!printerFileInput.files) {
		throw new Error("No files found in file input");
	}

	const file = printerFileInput.files[0];
	const gcode = await file.text();

	// Send the G-code to the printer
	sendGCodeFile(new Blob([gcode]), file.name);
});

ipAddressInput.addEventListener("change", () => {
	connectToPrinter(ipAddressInput.value)
		.then(() => {
			console.log("successful connection");
			ipAddressFailure.classList.toggle("hide");
			ipAddressSuccess.classList.toggle("hide");
		})
		.catch((error) => {
			console.error("CAUGHT:", error);
		});
});

newMaterialProfileForm.addEventListener("submit", (event) => {
	event.preventDefault();

	const materialProfileDisplay = new FormData(newMaterialProfileForm);
	const { materialProfileName, ...rest } = Object.fromEntries(
		materialProfileDisplay.entries(),
	) as unknown as MaterialProfile & { materialProfileName: string };

	const numericRest = Object.fromEntries(
		Object.entries(rest).map(([key, value]) => [key, Number(value)]),
	) as unknown as MaterialProfile;

	window.materialProfiles = {
		...window.materialProfiles,
		[materialProfileName]: numericRest,
	};

	localStorage.materialProfiles = JSON.stringify(window.materialProfiles);

	appendMaterialProfiles();

	newMaterialProfileForm.reset();
	newMaterialProfile.classList.toggle("hide");
});

editMaterialProfiles.addEventListener("click", () => {
	newMaterialProfile.classList.toggle("hide");
});

cancelMaterialProfileButton.addEventListener("click", () => {
	newMaterialProfileForm.reset();
	newMaterialProfile.classList.toggle("hide");
});

activeMaterialProfileSelect.addEventListener("change", (event) => {
	const selectedProfile =
		window.materialProfiles[(event.target as HTMLSelectElement).value];

	console.log(selectedProfile);

	for (const [key, value] of Object.entries(selectedProfile)) {
		const display = document.querySelector(`#${key}Display`);

		if (!display) {
			throw new Error(`No display found for ${key}`);
		}

		display.innerHTML = String(value);
	}
});

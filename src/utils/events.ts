import pThrottle from "p-throttle";

import { connectToPrinter, sendGCodeFile } from "@/3d/sendGCodeFile";
import { appendMaterialProfiles } from "@/db/appendMaterialProfiles";
import { addNewMaterialProfile } from "@/db/materialProfiles";

import { setSendToFile } from "@/db/appSettings";
import { triggerSendToFileEffect } from "@/db/loadMainDataForm";
import {
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
	sendToFile,
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

printerFileInput.addEventListener("change", async () => {
	if (!printerFileInput.files) {
		throw new Error("No files found in file input");
	}

	const file = printerFileInput.files[0];
	const gcode = await file.text();

	// Send the G-code to the printer
	sendGCodeFile(new Blob([gcode]), file.name);
});

const throttle = pThrottle({
	limit: 1,
	interval: 1000,
});

ipAddressInput.addEventListener(
	"change",
	throttle(() => {
		connectToPrinter(ipAddressInput.value)
			.then(() => {
				ipAddressFailure.classList.toggle("hide");
				ipAddressSuccess.classList.toggle("hide");
			})
			.catch((error) => {
				console.error("CAUGHT:", error);
			});
	}),
);

newMaterialProfileForm.addEventListener("submit", (event) => {
	event.preventDefault();

	const materialProfileDisplay = new FormData(newMaterialProfileForm);
	const { materialProfileName, ...rest } = Object.fromEntries(
		materialProfileDisplay.entries(),
	);

	addNewMaterialProfile({
		name: materialProfileName as string,
		nozzleTemp: Number(rest.nozzleTemp),
		cupTemp: Number(rest.cupTemp),
		shrinkFactor: Number(rest.shrinkFactor),
		outputFactor: Number(rest.outputFactor),
	});

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

sendToFile.addEventListener("change", (evt) => {
	const target = evt.target as HTMLInputElement;
	setSendToFile(target.checked);
	triggerSendToFileEffect();
});

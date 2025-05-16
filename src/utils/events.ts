import hotkeys from "hotkeys-js";

import { connectToPrinter } from "@/3d/sendGCodeFile";
import {
	getIpAddress,
	saveActiveMaterialProfile,
	toggleDebugMode,
} from "@/db/appSettings";
import { appendMaterialProfiles } from "@/db/appendMaterialProfiles";
import { loadActiveMaterialProfile } from "@/db/loadMainDataForm";
import {
	deleteActiveMaterialProfile,
	getMaterialProfiles,
} from "@/db/materialProfiles";
import { isFQDN, isIP } from "validator";

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

hotkeys("ctrl+shift+d,ctrl+shift+r", (event, handler) => {
	switch (handler.key) {
		case "ctrl+shift+d":
			toggleDebugMode().then((data) => {
				if (data) {
					console.log("Debug mode enabled");
				} else {
					console.log("Debug mode disabled");
				}
			});
			break;
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
	console.log("Printer connection check");

	const storedIpAddress = await getIpAddress();
	const ipAddress = ipAddressInput.value || storedIpAddress;
	const isValid =
		isIP(ipAddress) || isFQDN(ipAddress) || ipAddress.includes("localhost");

	console.log("IP address", ipAddress, "is valid", isValid);

	if (isValid) {
		try {
			// await setPrinterIp(ipAddress); // Uncomment this line if you want to set the IP address in Deno

			const { sessionTimeout } = await connectToPrinter(ipAddress);

			console.info("Printer connected");
			console.log("Session timeout:", sessionTimeout);

			ipAddressFailure.classList.toggle("hide");
			ipAddressSuccess.classList.toggle("hide");

			if (sessionTimeout) {
				const timeout = Math.max(0, sessionTimeout - 1000);
				setTimeout(printerConnection, timeout);
			} else {
				console.warn("Session timeout is not defined");
				const timeout = 5000;
				setTimeout(printerConnection, timeout);
			}
		} catch (error) {
			console.error("Error connecting to printer:", error);
			ipAddressFailure.classList.remove("hide");
			ipAddressSuccess.classList.add("hide");
		}
	}
};

ipAddressInput.addEventListener("input", printerConnection);
setTimeout(async () => {
	await printerConnection();
}, 1000);

window.addEventListener("load", () => {
	console.log("Window loaded");
});

window.addEventListener("DOMContentLoaded", () => {
	console.log("DOM fully loaded and parsed");
});

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

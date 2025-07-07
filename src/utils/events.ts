import hotkeys from "hotkeys-js";
import { max } from "mathjs";
import { isFQDN, isIP } from "validator";

import { connectToPrinter } from "@/3d/sendGCodeFile";
import { appendMaterialProfiles } from "@/db/appendMaterialProfiles";
import { getIpAddress, saveActiveMaterialProfile } from "@/db/keyValueSettings";
import { loadActiveMaterialProfile } from "@/db/loadMainDataForm";
import {
	deleteActiveMaterialProfile,
	getMaterialProfiles,
} from "@/db/materialProfiles";

import {
	activateInfoDialog,
	addMaterialProfile,
	appInfo,
	deleteMaterialProfileButton,
	editActiveMaterialProfile,
	ipAddressFailure,
	ipAddressInput,
	ipAddressSuccess,
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

let isConnecting = false;
let connectionTimeoutId: number | undefined;
let retryCount = 0;
const MAX_RETRIES = 10;

const printerConnection = async () => {
	// Prevent concurrent connection attempts
	if (isConnecting) {
		return;
	}

	const storedIpAddress = await getIpAddress();
	const ipAddress = ipAddressInput.value || storedIpAddress;
	const isValid =
		isIP(ipAddress) || isFQDN(ipAddress) || ipAddress.includes("localhost");

	if (!isValid) {
		console.warn("Invalid IP address or FQDN:", ipAddress);
		ipAddressFailure.classList.remove("hide");
		ipAddressSuccess.classList.add("hide");
		return;
	}

	isConnecting = true;

	try {
		const { sessionTimeout } = await connectToPrinter(ipAddress);

		console.log("Connected to printer at:", ipAddress);
		console.log("Session timeout:", sessionTimeout);

		// Reset retry count on successful connection
		retryCount = 0;

		ipAddressFailure.classList.add("hide");
		ipAddressSuccess.classList.remove("hide");

		// Schedule next connection attempt
		const timeout = sessionTimeout
			? max(1000, sessionTimeout - 1000) // Ensure minimum 1 second, reconnect 1 second before timeout
			: 30000; // Increase default interval to 30 seconds for health checks

		connectionTimeoutId = window.setTimeout(async () => {
			isConnecting = false;
			await printerConnection();
		}, timeout) as number;
	} catch (error) {
		console.error("Error connecting to printer:", error);
		retryCount++;

		ipAddressFailure.classList.remove("hide");
		ipAddressSuccess.classList.add("hide");

		// Exponential backoff with max retries
		if (retryCount <= MAX_RETRIES) {
			const backoffDelay = Math.min(1000 * 2 ** (retryCount - 1), 30000); // Cap at 30 seconds
			console.log(
				`Retrying connection in ${backoffDelay}ms (attempt ${retryCount}/${MAX_RETRIES})`,
			);

			connectionTimeoutId = window.setTimeout(async () => {
				isConnecting = false;
				await printerConnection();
			}, backoffDelay) as number;
		} else {
			console.warn("Max retry attempts reached. Stopping connection attempts.");
		}
	} finally {
		isConnecting = false;
	}
};

const handleIpAddressChange = async () => {
	// Clear existing timeout when IP changes
	if (connectionTimeoutId) {
		window.clearTimeout(connectionTimeoutId);
		connectionTimeoutId = undefined;
	}

	// Reset retry count when user changes IP
	retryCount = 0;
	isConnecting = false;

	await printerConnection();
};

ipAddressInput.addEventListener("input", handleIpAddressChange);
setTimeout(async () => await printerConnection(), 500);

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

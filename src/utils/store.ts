import type { ProvelPrintApp } from "@/global";

import {
	appForm,
	ipAddressFailure,
	ipAddressInput,
	ipAddressSuccess,
	restoreDefaultsButton,
} from "./htmlElements";
import { appendMaterialProfiles } from "./materialProfiles";
import { connectToPrinter } from "./sendGCodeFile";
import { isValidIpAddress, loadMainDataForm } from "./storeFunctions";

const defaultStore: ProvelPrintApp = {
	ipAddress: "",
	lockPosition: "left",
	cupSize: "93x38",
	nozzleSize: 5,
	layerHeight: 1,
	activeMaterialProfile: "cp1",
};

const materialProfiles = {
	cp1: {
		nozzleTemp: 200,
		cupTemp: 130,
		shrinkFactor: 2.6,
		outputFactor: 1.0,
	},
};

window.addEventListener("DOMContentLoaded", () => {
	if (localStorage.provelPrintStore) {
		window.provelPrintStore = JSON.parse(localStorage.provelPrintStore); //TODO: these come in as strings and not numbers
		window.materialProfiles = JSON.parse(localStorage.materialProfiles);

		loadMainDataForm();

		const validIpAddress = isValidIpAddress(
			window.provelPrintStore.ipAddress as string,
		);

		if (validIpAddress && import.meta.env.MODE !== "development") {
			connectToPrinter(window.provelPrintStore.ipAddress as string)
				.then(() => {
					console.log("successful connection");
					ipAddressFailure.classList.toggle("hide");
					ipAddressSuccess.classList.toggle("hide");
				})
				.catch((error) => {
					console.error("CAUGHT:", error);
				});
		}
	}
	if (!window.provelPrintStore) {
		window.provelPrintStore = defaultStore;
	}

	if (localStorage.materialProfiles) {
		window.materialProfiles = JSON.parse(localStorage.materialProfiles);
	}

	if (!window.materialProfiles) {
		window.materialProfiles = materialProfiles;
	}

	appendMaterialProfiles();
});

restoreDefaultsButton.addEventListener("click", () => {
	window.provelPrintStore = defaultStore;
	localStorage.provelPrintStore = JSON.stringify(window.provelPrintStore);

	window.materialProfiles = materialProfiles;
	localStorage.materialProfiles = JSON.stringify(window.materialProfiles);
	appendMaterialProfiles();

	loadMainDataForm();
});

ipAddressInput.addEventListener("keyup", (event) => {
	const value = (event.target as HTMLInputElement).value;

	if (value === "") {
		ipAddressInput.classList.remove("error");
		return;
	}

	const validIpAddress = isValidIpAddress(value);

	if (validIpAddress) {
		ipAddressInput.classList.remove("error");
	} else {
		ipAddressInput.classList.add("error");
	}
});

appForm.addEventListener("change", (event) => {
	event.preventDefault();

	const storeForm = new FormData(appForm);
	const storeFormEntries = Object.fromEntries(
		storeForm.entries(),
	) as unknown as ProvelPrintApp;

	localStorage.provelPrintStore = JSON.stringify(storeFormEntries);

	window.provelPrintStore = { ...window.provelPrintStore, ...storeFormEntries };
});

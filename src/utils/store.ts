import type { MaterialProfile, ProvelPrintApp } from "@/global";

import {
	appForm,
	ipAddressFailure,
	ipAddressInput,
	ipAddressSuccess,
	materialProfileForm,
	restoreDefaultsButton,
} from "./htmlElements";
import { connectToPrinter } from "./sendGCodeFile";
import { isValidIpAddress, loadDataIntoDom } from "./storeFunctions";

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
		window.provelPrintStore = JSON.parse(localStorage.provelPrintStore);
		window.materialProfiles = JSON.parse(localStorage.materialProfiles);

		loadDataIntoDom();

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
		window.materialProfiles = materialProfiles;
	}
});

restoreDefaultsButton.addEventListener("click", () => {
	window.provelPrintStore = defaultStore;
	window.materialProfiles = materialProfiles;

	localStorage.provelPrintStore = JSON.stringify(window.provelPrintStore);
	localStorage.materialProfiles = JSON.stringify(window.materialProfiles);

	loadDataIntoDom();
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

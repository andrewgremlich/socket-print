import type { ProvelPrintApp } from "@/global";
import { appForm, ipAddressInput, restoreDefaultsButton } from "./htmlElements";

const defaultSetting = {
	cupSize: "93x38",
	cupTemp: 130,
	layerHeight: 1,
	material: "cp1",
	nozzleSize: 5,
	nozzleTemp: 200,
	outputFactor: 1,
	ipAddress: "",
	shrinkFactor: 2.6,
};

function loadDataIntoDom() {
	const data = window.provelPrintStore;
	const formData = new FormData(appForm);

	for (const [key, _value] of formData.entries()) {
		const input = appForm.querySelector(`[name="${key}"]`) as HTMLInputElement;

		if (["printerFileInput"].includes(key)) {
			continue;
		}

		if (input) {
			input.value = data[key as keyof ProvelPrintApp] as string;
		}
	}

	return formData;
}

window.addEventListener("DOMContentLoaded", () => {
	if (localStorage.getItem("provelPrintStore")) {
		window.provelPrintStore = JSON.parse(
			localStorage.getItem("provelPrintStore") as string,
		);

		loadDataIntoDom();
	}

	if (!window.provelPrintStore) {
		window.provelPrintStore = defaultSetting;
	}
});

restoreDefaultsButton.addEventListener("click", () => {
	window.provelPrintStore = defaultSetting;
	localStorage.setItem(
		"provelPrintStore",
		JSON.stringify(window.provelPrintStore),
	);
	loadDataIntoDom();
});

ipAddressInput.addEventListener("keyup", (event) => {
	const value = (event.target as HTMLInputElement).value;

	if (value === "") {
		ipAddressInput.classList.remove("error");
		return;
	}

	const splitValue = value.split(".");
	const validIpAddress =
		splitValue.length === 4 &&
		splitValue.every((v) => v !== "" && !Number.isNaN(Number(v)));

	if (validIpAddress) {
		ipAddressInput.classList.remove("error");
	} else {
		ipAddressInput.classList.add("error");
	}
});

appForm.addEventListener("change", (event) => {
	event.preventDefault();

	const formData = new FormData(appForm);
	const values = Object.fromEntries(
		formData.entries(),
	) as unknown as ProvelPrintApp;
	const convertNumValues = Object.keys(values).reduce(
		(acc: ProvelPrintApp, key) => {
			const incomingKey = key as keyof ProvelPrintApp;

			if (Number(values[incomingKey])) {
				const converted = Number(values[incomingKey]);

				if (converted <= 0) {
					throw new Error(`Value for ${incomingKey} must be greater than 0`);
				}

				acc[incomingKey] = Number(values[incomingKey]);
			} else {
				acc[incomingKey] = values[incomingKey];
			}

			return acc;
		},
		{
			cupSize: "93x38",
			cupTemp: 0,
			layerHeight: 0,
			material: "",
			nozzleSize: 0,
			nozzleTemp: 0,
			outputFactor: 0,
			ipAddress: 0,
			shrinkFactor: 0,
		},
	);
	const newState = {
		...window.provelPrintStore,
		...convertNumValues,
	};

	localStorage.setItem("provelPrintStore", JSON.stringify(newState));

	window.provelPrintStore = newState;
});

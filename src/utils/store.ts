import type { ProvelPrintApp } from "@/global";
import { appForm } from "./htmlElements";

window.provelPrintStore = {
	cupSize: "93x38",
	cupTemp: 130,
	layerHeight: 1,
	material: "cp1",
	nozzleSize: 3,
	nozzleTemp: 200,
	outputFactor: 1,
	ipAddress: "http://",
	shrinkFactor: 2.6,
};

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

	console.log(convertNumValues);

	window.provelPrintStore = {
		...window.provelPrintStore,
		...convertNumValues,
	};
});

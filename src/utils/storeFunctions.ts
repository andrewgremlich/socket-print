import type { ProvelPrintApp } from "@/global";
import { appForm } from "./htmlElements";

export function isValidIpAddress(ipAddress: string) {
	const splitValue = ipAddress.split(".");
	return (
		splitValue.length === 4 &&
		splitValue.every((v) => v !== "" && !Number.isNaN(Number(v)))
	);
}

export function loadMainDataForm() {
	const store = window.provelPrintStore;
	const storeForm = new FormData(appForm);

	for (const [key, _value] of storeForm.entries()) {
		const input = appForm.querySelector(
			`[name="${key}"]`,
		) as HTMLInputElement | null;

		if (input) {
			input.value = `${store[key as keyof ProvelPrintApp]}`;
		}
	}
}

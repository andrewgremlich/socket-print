import type { ProvelPrintApp } from "@/global";
import { appForm, materialProfileForm } from "./htmlElements";

export function isValidIpAddress(ipAddress: string) {
	const splitValue = ipAddress.split(".");
	return (
		splitValue.length === 4 &&
		splitValue.every((v) => v !== "" && !Number.isNaN(Number(v)))
	);
}

export function loadDataIntoDom() {
	const store = window.provelPrintStore;
	const profiles = window.materialProfiles;
	const storeForm = new FormData(appForm);
	const materialProfilesForm = new FormData(materialProfileForm);

	for (const [key, _value] of storeForm.entries()) {
		const input = appForm.querySelector(
			`[name="${key}"]`,
		) as HTMLInputElement | null;

		if (input) {
			input.value = `${store[key as keyof ProvelPrintApp]}`;
		}
	}

	for (const [key, _value] of materialProfilesForm.entries()) {
		const input = materialProfileForm.querySelector(
			`[name="${key}"]`,
		) as HTMLInputElement | null;

		if (input) {
			input.value = `${profiles[key]}`;
		}
	}
}

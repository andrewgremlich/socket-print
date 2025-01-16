import { activeMaterialProfileSelect } from "./htmlElements";

export const appendMaterialProfiles = () => {
	const profileNames = Object.keys(window.materialProfiles);

	activeMaterialProfileSelect.innerHTML = "";

	for (const name of profileNames) {
		const newProfile = document.createElement("option");

		newProfile.value = name;
		newProfile.textContent = name;

		activeMaterialProfileSelect.appendChild(newProfile);
	}
};

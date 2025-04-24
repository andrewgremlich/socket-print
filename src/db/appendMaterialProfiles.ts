import { activeMaterialProfileSelect } from "@/utils/htmlElements";

import { getMaterialProfiles } from "./materialProfiles";

export const appendMaterialProfiles = async () => {
	const materialProfiles = await getMaterialProfiles();

	activeMaterialProfileSelect.innerHTML = "";

	for (const profile of materialProfiles) {
		const newProfile = document.createElement("option");

		newProfile.value = profile.name;
		newProfile.textContent = profile.name;

		activeMaterialProfileSelect.appendChild(newProfile);
	}
};

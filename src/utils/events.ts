import { setSendToFile } from "@/db/appSettings";
import { triggerSendToFileEffect } from "@/db/loadMainDataForm";
import {
	addMaterialProfile,
	editActiveMaterialProfile,
	materialProfileForm,
	menuBar,
	menuBarDropdowns,
	sendToFile,
} from "./htmlElements";

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

addMaterialProfile.addEventListener("click", () =>
	materialProfileForm.showForm("new"),
);

editActiveMaterialProfile.addEventListener("click", () =>
	materialProfileForm.showForm("edit"),
);

sendToFile.addEventListener("change", (evt) => {
	const target = evt.target as HTMLInputElement;
	setSendToFile(target.checked);
	triggerSendToFileEffect();
});

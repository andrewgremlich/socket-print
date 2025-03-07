import { Submenu } from "@tauri-apps/api/menu";

import { saveActiveMaterialProfile } from "@/db/appSettings";
import { appendMaterialProfiles } from "@/db/appendMaterialProfiles";
import { loadActiveMaterialProfile } from "@/db/loadMainDataForm";
import {
	deleteActiveMaterialProfile,
	getMaterialProfiles,
} from "@/db/materialProfiles";
import { materialProfileForm } from "@/utils/htmlElements";

export const editSubMenu = await Submenu.new({
	id: "edit",
	text: "Edit",
	items: [
		{
			id: "addMaterialProfile",
			text: "Add Material Profile",
			action: async () => {
				console.log("add material profile");
				materialProfileForm.showForm("new");
			},
		},
		{
			id: "editActiveMaterialProfile",
			text: "Edit Active Material Profile",
			action: async () => {
				console.log("edit active material profile");
				materialProfileForm.showForm("edit");
			},
		},
		{
			id: "deleteMaterialProfile",
			text: "Delete Material Profile",
			action: async () => {
				console.log("delete material profile action triggered");

				await deleteActiveMaterialProfile();

				const materialProfiles = await getMaterialProfiles();

				await saveActiveMaterialProfile(materialProfiles[0].name);
				await appendMaterialProfiles();
				await loadActiveMaterialProfile();
			},
		},
	],
});

import { Submenu } from "@tauri-apps/api/menu";
import { open } from "@tauri-apps/plugin-dialog";

import { setAllAppSettings } from "@/db/appSettings";
import { defaultSettingNames } from "@/db/checkDb";
import { initData } from "@/db/store";

export const fileSubMenu = await Submenu.new({
	id: "file",
	text: "File",
	items: [
		{
			id: "open",
			text: "Open File",
			accelerator: "CmdOrCtrl+O",
			action: async () => {
				console.log("Open Filez");
				const file = await open({
					multiple: false,
					directory: false,
					filters: [{ name: "STL Files", extensions: ["stl"] }],
				});
				if (file) {
					console.log(`Opened file: ${file}`);
				} else {
					console.log("No file was selected.");
				}
			},
		},
		{
			id: "restore",
			text: "Restore",
			accelerator: "CmdOrCtrl+R",
			action: async () => {
				console.log("Restore");
				await setAllAppSettings(defaultSettingNames);
				await initData();
			},
		},
		{
			id: "clear",
			text: "Clear Model",
			accelerator: "CmdOrCtrl+Shift+C",
			action: () => {
				console.log("Clear Model");
			},
		},
	],
});

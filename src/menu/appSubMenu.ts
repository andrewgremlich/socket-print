import { Submenu } from "@tauri-apps/api/menu";

export const appSubMenu = await Submenu.new({
	id: "app",
	text: "App",
	items: [
		{
			id: "info",
			text: "Info",
			action: async () => {
				console.log("info action triggered");
			},
		},
		{
			id: "settings",
			text: "Settings",
			action: async () => {
				console.log("settings action triggered");
			},
		},
	],
});

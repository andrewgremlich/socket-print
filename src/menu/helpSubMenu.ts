import { Submenu } from "@tauri-apps/api/menu";

export const helpSubMenu = await Submenu.new({
	id: "help",
	text: "Help",
	items: [
		{
			id: "helpPage",
			text: "Help Page",
			action: async () => {
				console.log("open help page");
			},
		},
	],
});

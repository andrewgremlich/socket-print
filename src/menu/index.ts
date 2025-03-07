import { Menu } from "@tauri-apps/api/menu";

import { appSubMenu } from "./appSubMenu";
import { editSubMenu } from "./editSubMenu";
import { fileSubMenu } from "./fileSubMenu";
import { helpSubMenu } from "./helpSubMenu";

const menu = await Menu.new({
	items: [appSubMenu, fileSubMenu, editSubMenu, helpSubMenu],
});

await menu.setAsAppMenu();

/** Endpoints that report or drive machine state rather than the SD card. */

import { FIRMWARE_VERSION } from "../config.ts";
import { json, type RouteHandler, text } from "../http.ts";
import { objectModel, runGCode, takeReply } from "../machine.ts";

export const machineRoutes: Record<string, RouteHandler> = {
	"/rr_status": (_req, url) => {
		// Deprecated in RRF 3.6; kept so older clients still get a shape.
		const type = Number(url.searchParams.get("type") ?? "1");
		return json({
			status: "I",
			statusType: type,
			coords: { xyz: [0, 0, 0], extr: [0] },
			temps: { bed: { current: 20, active: 0 } },
		});
	},

	"/rr_config": () =>
		json({
			firmwareVersion: FIRMWARE_VERSION,
			firmwareElectronics: "Duet 3 MB6XD",
			sysdir: "0:/sys/",
		}),

	"/rr_gcode": (_req, url) => {
		const gcode = url.searchParams.get("gcode") ?? "";
		console.log(`[GCODE] ${gcode}`);
		runGCode(gcode);
		return json({ buff: 512 });
	},

	// Per spec this is plain text, not JSON.
	"/rr_reply": () => text(takeReply()),

	"/rr_model": (_req, url) => {
		const key = url.searchParams.get("key") ?? "";
		const flags = url.searchParams.get("flags") ?? "";
		const result = objectModel[key];

		if (result === undefined) {
			console.log(`[MODEL] Unknown key "${key}"`);
			return text("Service Unavailable", 503);
		}

		console.log(`[MODEL] ${key}`);
		return json({ key, flags, result });
	},
};

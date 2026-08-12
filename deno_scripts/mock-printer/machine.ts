/** Machine state: reboots, the reply queue, the object model, and G-code. */

import { FIRMWARE_VERSION, REBOOT_DURATION_MS } from "./config.ts";
import { clearSessions } from "./sessions.ts";
import { fileExists, normalizePath } from "./vfs.ts";

let rebooting = false;
const replyQueue: string[] = [];

export function isRebooting(): boolean {
	return rebooting;
}

/** Pops the oldest queued rr_reply text, or "" when nothing is pending. */
export function takeReply(): string {
	return replyQueue.shift() ?? "";
}

function queueReply(reply: string): void {
	replyQueue.push(reply);
}

function reboot(what: string): void {
	console.log(`[REBOOT] ${what} — offline for ${REBOOT_DURATION_MS}ms`);
	rebooting = true;
	clearSessions();
	setTimeout(() => {
		rebooting = false;
		console.log("[REBOOT] Back online");
	}, REBOOT_DURATION_MS);
}

export const objectModel: Record<string, unknown> = {
	"boards[0]": {
		firmwareVersion: FIRMWARE_VERSION,
		firmwareName: "RepRapFirmware for Duet 3 MB6XD",
		name: "Duet 3 Mainboard 6XD",
		shortName: "MB6XD",
		mcuTemp: { current: 41.2, min: 38.1, max: 44.7 },
	},
	"state": { status: "idle", upTime: 1234, machineMode: "FFF" },
	"network": { name: "ProvelPrinter1", hostname: "provelprinter1" },
};

export function runGCode(gcode: string): void {
	const trimmed = gcode.trim();

	// M997 S4 P"0:/firmware/<name>.bin" — flash the PanelDue screen.
	const panelDue = trimmed.match(/^M997\s+S4\s+P"([^"]+)"/i);
	if (panelDue) {
		const target = normalizePath(panelDue[1]);
		if (!fileExists(target)) {
			const message = `Error: Firmware file ${target} not found`;
			console.log(`[FLASH] ${message}`);
			queueReply(message);
			return;
		}
		console.log(`[FLASH] PanelDue firmware from ${target}`);
		queueReply("Updating PanelDue firmware");
		return;
	}

	// M997 on its own updates the mainboard, which reboots it.
	if (/^M997\b/i.test(trimmed)) {
		queueReply("Updating main firmware");
		reboot("Mainboard firmware flash");
		return;
	}

	if (/^M999\b/i.test(trimmed)) {
		queueReply("");
		reboot("M999 restart");
		return;
	}

	if (/^M115\b/i.test(trimmed)) {
		queueReply(
			`FIRMWARE_NAME:RepRapFirmware for Duet 3 MB6XD FIRMWARE_VERSION:${FIRMWARE_VERSION} ELECTRONICS:Duet 3 MB6XD`,
		);
		return;
	}

	// M98 P"0:/sys/provel/x.g" — run a macro. Report missing macros the way
	// the board would, which is the main way a bad board-file install shows up.
	const macro = trimmed.match(/^M98\s+P"([^"]+)"/i);
	if (macro) {
		const target = normalizePath(macro[1]);
		queueReply(
			fileExists(target) ? "" : `Error: Macro file ${target} not found`,
		);
		return;
	}

	queueReply("");
}

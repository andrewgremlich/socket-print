import type {
	BoardFileGroup,
	BoardFileGroupName,
	BoardFilesManifest,
	FileResult,
	FlashOutcome,
	GroupStatus,
	InstallSummary,
} from "./boardFileTypes";
import {
	directoryExists,
	downloadFile,
	getReply,
	isNewerVersion,
	makeDirectory,
	type PrinterSession,
	uploadFile,
	withPrinterSession,
} from "./printerApi";

const PKG_JSON_FILE = "package.json";
const GROUP_ORDER: BoardFileGroupName[] = ["system", "provel", "screen"];

// M997 S4 hands the binary to the PanelDue over the serial link and returns
// straight away, so the first rr_reply is usually empty and any complaint
// ("Error: Firmware file not found") lands a beat later. Read a few times
// before calling the flash clean.
const FLASH_REPLY_POLLS = 4;
const FLASH_REPLY_INTERVAL_MS = 1500;

/** Joins a board directory and file name into a full SD card path. */
function boardPath(target: string, fileName: string): string {
	return `${target.replace(/\/$/, "")}/${fileName}`;
}

/** URL of a bundled board file within the app's own static assets. */
function assetUrl(group: BoardFileGroupName, fileName: string): string {
	return `/board-files/${group}/${encodeURIComponent(fileName)}`;
}

export async function fetchManifest(): Promise<BoardFilesManifest> {
	const response = await fetch("/board-files/manifest.json", {
		cache: "no-cache",
	});

	if (!response.ok) {
		throw new Error(
			`Could not load board files manifest. HTTP ${response.status}`,
		);
	}

	const manifest: BoardFilesManifest = await response.json();

	if (!manifest?.groups) {
		throw new Error("Board files manifest is missing its groups.");
	}

	console.log(`Manifest generated ${manifest.generatedAt}`);

	for (const [name, group] of Object.entries(manifest.groups)) {
		console.log(
			`  ${name}: v${group.version}, ${group.files.length} files -> ${group.target}`,
		);
	}

	return manifest;
}

/** Reads a group's installed version from its package.json on the board. */
async function readInstalledVersion(
	session: PrinterSession,
	target: string,
): Promise<string | null> {
	const path = boardPath(target, PKG_JSON_FILE);
	const body = await downloadFile(session, path);

	if (body === null) {
		console.log(`${path} not found on board — nothing installed yet`);
		return null;
	}

	try {
		const parsed = JSON.parse(body);
		if (typeof parsed.version !== "string") {
			console.warn(
				`${path} has no "version" field — treating as not installed`,
			);
			return null;
		}
		return parsed.version;
	} catch {
		console.warn(`${path} is not valid JSON — treating as not installed`);
		return null;
	}
}

export async function checkBoardFileVersions(): Promise<GroupStatus[]> {
	const manifest = await fetchManifest();

	return withPrinterSession(async (session) => {
		const statuses: GroupStatus[] = [];

		for (const name of GROUP_ORDER) {
			const group = manifest.groups[name];
			if (!group || group.files.length === 0) {
				console.log(`${name}: no files bundled — skipping`);
				continue;
			}

			const installedVersion = await readInstalledVersion(
				session,
				group.target,
			);
			const needsUpdate =
				installedVersion === null ||
				isNewerVersion(installedVersion, group.version);

			console.log(
				`${name}: board ${installedVersion ?? "not installed"} (${boardPath(group.target, PKG_JSON_FILE)}) vs app ${group.version} -> ${needsUpdate ? "update needed" : "up to date"}`,
			);

			statuses.push({
				group: name,
				target: group.target,
				bundledVersion: group.version,
				installedVersion,
				needsUpdate,
				fileCount: group.files.length,
			});
		}

		return statuses;
	});
}

/** Fetches one bundled board file out of the app's own static assets. */
async function readBundledFile(
	group: BoardFileGroupName,
	fileName: string,
): Promise<Blob> {
	const response = await fetch(assetUrl(group, fileName), {
		cache: "no-cache",
	});

	if (!response.ok) {
		throw new Error(
			`Could not read bundled file ${fileName}: HTTP ${response.status}`,
		);
	}

	return response.blob();
}

async function uploadGroup(
	session: PrinterSession,
	name: BoardFileGroupName,
	group: BoardFileGroup,
	files: string[],
	onProgress: (result: FileResult) => void,
): Promise<FileResult[]> {
	const results: FileResult[] = [];

	// The manifest already orders package.json last so a partial batch never
	// leaves the board advertising a version it does not fully have.
	for (const fileName of files) {
		const startedAt = performance.now();
		let result: FileResult;

		try {
			const blob = await readBundledFile(name, fileName);
			await uploadFile(session, boardPath(group.target, fileName), blob);
			result = {
				group: name,
				file: fileName,
				ok: true,
				bytes: blob.size,
				ms: performance.now() - startedAt,
			};
			console.log(`${name}/${fileName} uploaded (${blob.size} B)`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			result = {
				group: name,
				file: fileName,
				ok: false,
				bytes: 0,
				ms: performance.now() - startedAt,
				error: message,
			};
			// Keep going: a half-applied config is bad, but stopping at file 3
			// of 26 with no diagnosis is worse when debugging remotely.
			console.warn(`${name}/${fileName} FAILED: ${message}`);
		}

		results.push(result);
		onProgress(result);
	}

	return results;
}

/** Collects whatever the board says over the seconds after M997 is sent. */
async function collectFlashReply(session: PrinterSession): Promise<string> {
	const lines: string[] = [];

	for (let poll = 0; poll < FLASH_REPLY_POLLS; poll += 1) {
		const reply = (await getReply(session)).trim();

		if (reply) {
			lines.push(reply);
			console.log(`M997 S4 reply: ${reply}`);
		}

		if (poll < FLASH_REPLY_POLLS - 1) {
			await new Promise((resolve) =>
				setTimeout(resolve, FLASH_REPLY_INTERVAL_MS),
			);
		}
	}

	return lines.join(" ");
}

/**
 * Flashes the PanelDue screen with a binary already uploaded to the group's
 * target directory. Resolves with the outcome rather than throwing on a board
 * refusal, so the caller can withhold the version marker and still report the
 * rest of the install.
 */
async function flashScreenFirmware(
	session: PrinterSession,
	group: BoardFileGroup,
	binaryName: string,
): Promise<FlashOutcome> {
	console.log(`Flashing PanelDue from ${boardPath(group.target, binaryName)}`);

	try {
		// M997 S4 pushes the binary to the PanelDue over the serial link. Unlike
		// a bare M997 it does not restart the mainboard. P takes the file name on
		// its own: RepRapFirmware resolves it against the board's firmware
		// directory, which is what group.target ("0:/firmware") points at.
		const response = await session.request(
			`/rr_gcode?gcode=${encodeURIComponent(`M997 S4 P"${binaryName}"`)}`,
		);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const reply = await collectFlashReply(session);

		// An empty reply is the normal success path: the board accepts the
		// command and says nothing while the screen reflashes.
		if (/error|fail|not found|unknown/i.test(reply)) {
			return {
				binary: binaryName,
				ok: false,
				reply,
				error: `Board rejected the flash: ${reply}`,
			};
		}

		return { binary: binaryName, ok: true, reply };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn(`Screen firmware flash failed: ${message}`);
		return { binary: binaryName, ok: false, reply: "", error: message };
	}
}

/**
 * Uploads the firmware payload, flashes the screen, and only then writes the
 * version marker. Doing the marker last means a board that reports v1.2.0 in
 * 0:/firmware/package.json is a board actually running v1.2.0 — so a failed
 * flash still shows as "update available" and can simply be retried.
 *
 * Appends its file results to `results` and resolves with the flash outcome,
 * or null when nothing was flashed.
 */
async function installScreenGroup(
	session: PrinterSession,
	group: BoardFileGroup,
	onProgress: (result: FileResult) => void,
	results: FileResult[],
): Promise<FlashOutcome | null> {
	const payload = group.files.filter((file) => file !== PKG_JSON_FILE);
	const marker = group.files.filter((file) => file === PKG_JSON_FILE);
	const binary = payload.find((file) => file.endsWith(".bin"));

	const payloadResults = await uploadGroup(
		session,
		"screen",
		group,
		payload,
		onProgress,
	);
	results.push(...payloadResults);

	if (!payloadResults.every((result) => result.ok)) {
		console.warn("Screen firmware upload failed — not flashing");
		return null;
	}

	if (!binary) {
		console.log("screen: no .bin bundled — nothing to flash");
		return null;
	}

	const flash = await flashScreenFirmware(session, group, binary);

	if (!flash.ok) {
		console.warn("Flash failed — withholding the version marker");
		return flash;
	}

	results.push(
		...(await uploadGroup(session, "screen", group, marker, onProgress)),
	);

	return flash;
}

/**
 * Uploads every bundled file for the given groups. Creates 0:/sys/provel when
 * it does not already exist. Never aborts the batch on a single file failure —
 * failures are recorded and reported in the summary.
 */
export async function installBoardFiles(
	groups: BoardFileGroupName[],
	onProgress: (result: FileResult) => void,
): Promise<InstallSummary> {
	const manifest = await fetchManifest();
	const ordered = GROUP_ORDER.filter((name) => groups.includes(name));

	return withPrinterSession(async (session) => {
		const results: FileResult[] = [];
		let restartRequired = false;
		let screenFlash: FlashOutcome | null = null;

		for (const name of ordered) {
			const group = manifest.groups[name];
			if (!group || group.files.length === 0) {
				console.log(`${name}: no files bundled — skipping`);
				continue;
			}

			// The board ships with 0:/sys but not necessarily 0:/sys/provel.
			if (await directoryExists(session, group.target)) {
				console.log(`${group.target} already exists`);
			} else {
				console.log(`${group.target} missing — creating`);
				const created = await makeDirectory(session, group.target);
				console.log(
					created
						? `${group.target} created`
						: `${group.target} reported as already existing`,
				);
			}

			if (name === "screen" && group.kind === "screen-firmware") {
				const outcome = await installScreenGroup(
					session,
					group,
					onProgress,
					results,
				);
				screenFlash = outcome;
				continue;
			}

			const groupResults = await uploadGroup(
				session,
				name,
				group,
				group.files,
				onProgress,
			);
			results.push(...groupResults);

			const allSucceeded = groupResults.every((result) => result.ok);

			if (name === "system" && allSucceeded) {
				// config.g is only read at start-up.
				restartRequired = true;
			}
		}

		const uploaded = results.filter((result) => result.ok).length;
		const failed = results.length - uploaded;

		console.log(
			`Install complete: ${uploaded}/${results.length} uploaded, ${failed} failed`,
		);

		return { results, uploaded, failed, restartRequired, screenFlash };
	});
}

/** Sends M999 so the board re-reads 0:/sys/config.g. */
export async function restartBoard(): Promise<void> {
	await withPrinterSession(async (session) => {
		console.log("Sending M999 to restart the board");
		// Deliberately not read back via rr_reply: the board goes offline
		// immediately, so the follow-up request would fail on a success.
		await session.request(`/rr_gcode?gcode=${encodeURIComponent("M999")}`);
	});
}

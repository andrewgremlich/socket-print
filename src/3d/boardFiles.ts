import {
	directoryExists,
	downloadFile,
	isNewerVersion,
	makeDirectory,
	type PrinterSession,
	sendGCode,
	uploadFile,
	withPrinterSession,
} from "./printerApi";

/**
 * Installs the RepRapFirmware configuration that lives in `public/board-files`
 * onto the printer's SD card.
 *
 * The board's mainboard firmware is generic to the 6XD and is not managed here.
 * What is machine-specific — and what this module owns — are the macros in
 * `0:/sys` and `0:/sys/provel`, plus an optional PanelDue screen firmware
 * binary in `0:/firmware`.
 *
 * Each group carries a `package.json` holding its version. The same file is
 * written to the board, so a later run can read it back with rr_download and
 * decide whether an update is needed.
 */

export type BoardFileGroupName = "system" | "provel" | "screen";

export type BoardFileGroup = {
	version: string;
	/** Directory on the printer SD card, e.g. "0:/sys". */
	target: string;
	kind: "macros" | "screen-firmware";
	files: string[];
};

export type BoardFilesManifest = {
	generatedAt: string;
	groups: Record<string, BoardFileGroup>;
};

export type GroupStatus = {
	group: BoardFileGroupName;
	target: string;
	/** Version bundled with this build of the app. */
	bundledVersion: string;
	/** Version reported by the board, or null when nothing is installed. */
	installedVersion: string | null;
	needsUpdate: boolean;
	fileCount: number;
};

export type FileResult = {
	group: BoardFileGroupName;
	file: string;
	ok: boolean;
	bytes: number;
	ms: number;
	error?: string;
};

export type InstallSummary = {
	results: FileResult[];
	uploaded: number;
	failed: number;
	/** Set when 0:/sys changed, since config.g is only read at board start-up. */
	restartRequired: boolean;
};

const MANIFEST_URL = "/board-files/manifest.json";
const VERSION_MARKER = "package.json";

/** Groups install in this order: system config first, then its macros. */
const GROUP_ORDER: BoardFileGroupName[] = ["system", "provel", "screen"];

function log(message: string) {
	console.log(`[BOARD-FILES] ${message}`);
}

function logError(message: string) {
	console.error(`[BOARD-FILES] ${message}`);
}

/** Joins a board directory and file name into a full SD card path. */
function boardPath(target: string, fileName: string): string {
	return `${target.replace(/\/$/, "")}/${fileName}`;
}

/** URL of a bundled board file within the app's own static assets. */
function assetUrl(group: BoardFileGroupName, fileName: string): string {
	return `/board-files/${group}/${encodeURIComponent(fileName)}`;
}

export async function fetchManifest(): Promise<BoardFilesManifest> {
	const response = await fetch(MANIFEST_URL, { cache: "no-cache" });

	if (!response.ok) {
		throw new Error(
			`Could not load board file manifest: HTTP ${response.status}`,
		);
	}

	const manifest: BoardFilesManifest = await response.json();
	log(`Manifest generated ${manifest.generatedAt}`);

	for (const [name, group] of Object.entries(manifest.groups)) {
		log(
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
	const path = boardPath(target, VERSION_MARKER);
	const body = await downloadFile(session, path);

	if (body === null) {
		log(`${path} not found on board — nothing installed yet`);
		return null;
	}

	try {
		const parsed = JSON.parse(body);
		if (typeof parsed.version !== "string") {
			logError(`${path} has no "version" field — treating as not installed`);
			return null;
		}
		return parsed.version;
	} catch {
		logError(`${path} is not valid JSON — treating as not installed`);
		return null;
	}
}

/**
 * Compares each group's bundled version against the version installed on the
 * board. A missing, unreadable, or version-less package.json on the board
 * counts as "not installed" rather than an error.
 */
export async function checkBoardFileVersions(): Promise<GroupStatus[]> {
	const manifest = await fetchManifest();

	return withPrinterSession(async (session) => {
		const statuses: GroupStatus[] = [];

		for (const name of GROUP_ORDER) {
			const group = manifest.groups[name];
			if (!group || group.files.length === 0) {
				log(`${name}: no files bundled — skipping`);
				continue;
			}

			const installedVersion = await readInstalledVersion(
				session,
				group.target,
			);
			const needsUpdate =
				installedVersion === null ||
				isNewerVersion(installedVersion, group.version);

			log(
				`${name}: board ${installedVersion ?? "not installed"} (${boardPath(group.target, VERSION_MARKER)}) vs app ${group.version} -> ${needsUpdate ? "update needed" : "up to date"}`,
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
	onProgress: (result: FileResult) => void,
): Promise<FileResult[]> {
	const results: FileResult[] = [];

	// The manifest already orders package.json last so a partial batch never
	// leaves the board advertising a version it does not fully have.
	for (const fileName of group.files) {
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
			log(`${name}/${fileName} uploaded (${blob.size} B)`);
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
			logError(`${name}/${fileName} FAILED: ${message}`);
		}

		results.push(result);
		onProgress(result);
	}

	return results;
}

/**
 * Flashes the PanelDue screen. The binary is uploaded to 0:/firmware and the
 * board is then told to push it over the serial link with M997 S4.
 */
async function flashScreenFirmware(
	session: PrinterSession,
	group: BoardFileGroup,
	binaryName: string,
): Promise<void> {
	const target = boardPath(group.target, binaryName);
	log(`Flashing PanelDue from ${target}`);

	// M997 S4 pushes the binary to the PanelDue over the serial link. Unlike a
	// bare M997 it does not restart the mainboard, so there is nothing to poll
	// for here — the reply is the only signal.
	const reply = await sendGCode(session, `M997 S4 P"${target}"`);
	log(`M997 S4 reply: ${reply || "(empty)"}`);

	if (/error/i.test(reply)) {
		throw new Error(`Screen firmware flash rejected: ${reply}`);
	}
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

		for (const name of ordered) {
			const group = manifest.groups[name];
			if (!group || group.files.length === 0) {
				log(`${name}: no files bundled — skipping`);
				continue;
			}

			// The board ships with 0:/sys but not necessarily 0:/sys/provel.
			if (await directoryExists(session, group.target)) {
				log(`${group.target} already exists`);
			} else {
				log(`${group.target} missing — creating`);
				const created = await makeDirectory(session, group.target);
				log(
					created
						? `${group.target} created`
						: `${group.target} reported as already existing`,
				);
			}

			const groupResults = await uploadGroup(session, name, group, onProgress);
			results.push(...groupResults);

			const allSucceeded = groupResults.every((result) => result.ok);

			if (name === "system" && allSucceeded) {
				// config.g is only read at start-up.
				restartRequired = true;
			}

			if (
				name === "screen" &&
				allSucceeded &&
				group.kind === "screen-firmware"
			) {
				const binary = group.files.find((file) => file.endsWith(".bin"));
				if (binary) {
					await flashScreenFirmware(session, group, binary);
				}
			}
		}

		const uploaded = results.filter((result) => result.ok).length;
		const failed = results.length - uploaded;

		log(
			`Install complete: ${uploaded}/${results.length} uploaded, ${failed} failed`,
		);

		return { results, uploaded, failed, restartRequired };
	});
}

/** Sends M999 so the board re-reads 0:/sys/config.g. */
export async function restartBoard(): Promise<void> {
	await withPrinterSession(async (session) => {
		log("Sending M999 to restart the board");
		// Deliberately not read back via rr_reply: the board goes offline
		// immediately, so the follow-up request would fail on a success.
		await session.request(`/rr_gcode?gcode=${encodeURIComponent("M999")}`);
	});
}

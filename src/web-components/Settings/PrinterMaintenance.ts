import {
	checkBoardFileVersions,
	installBoardFiles,
	restartBoard,
} from "@/3d/boardFiles";
import type {
	BoardFileGroupName,
	FileResult,
	FlashOutcome,
	GroupStatus,
} from "@/3d/boardFileTypes";
import { getIpAddress } from "@/db/formValuesDbActions";

// The macro groups install together; the screen firmware is flashed on its own
// so an operator never reflashes the PanelDue just to push a macro change.
const MACRO_GROUPS: BoardFileGroupName[] = ["system", "provel"];

export class PrinterMaintenance {
	printerStatusSpan: HTMLSpanElement;
	screenFirmwareContainer: HTMLDivElement;
	flashScreenFirmwareButton: HTMLButtonElement;
	screenFirmwareStatus: HTMLParagraphElement;
	screenFirmwareLog: HTMLOListElement;
	installBoardFilesButton: HTMLButtonElement;
	restartBoardButton: HTMLButtonElement;
	boardFileStatus: HTMLParagraphElement;
	boardFileProgress: HTMLProgressElement;
	boardFileLog: HTMLOListElement;
	#groupStatuses: GroupStatus[] = [];

	constructor(private shadowRoot: ShadowRoot) {
		this.printerStatusSpan = this.shadowRoot.getElementById(
			"printerStatus",
		) as HTMLSpanElement;
		this.screenFirmwareContainer = this.shadowRoot.getElementById(
			"screenFirmwareContainer",
		) as HTMLDivElement;
		this.flashScreenFirmwareButton = this.shadowRoot.getElementById(
			"flashScreenFirmwareButton",
		) as HTMLButtonElement;
		this.screenFirmwareStatus = this.shadowRoot.getElementById(
			"screenFirmwareStatus",
		) as HTMLParagraphElement;
		this.screenFirmwareLog = this.shadowRoot.getElementById(
			"screenFirmwareLog",
		) as HTMLOListElement;
		this.installBoardFilesButton = this.shadowRoot.getElementById(
			"installBoardFilesButton",
		) as HTMLButtonElement;
		this.restartBoardButton = this.shadowRoot.getElementById(
			"restartBoardButton",
		) as HTMLButtonElement;
		this.boardFileStatus = this.shadowRoot.getElementById(
			"boardFileStatus",
		) as HTMLParagraphElement;
		this.boardFileProgress = this.shadowRoot.getElementById(
			"boardFileProgress",
		) as HTMLProgressElement;
		this.boardFileLog = this.shadowRoot.getElementById(
			"boardFileLog",
		) as HTMLOListElement;
		this.installBoardFilesButton.addEventListener("click", () =>
			this.performBoardFileInstall(),
		);
		this.flashScreenFirmwareButton.addEventListener("click", () =>
			this.performScreenFirmwareFlash(),
		);
		this.restartBoardButton.addEventListener("click", () =>
			this.performBoardRestart(),
		);
	}

	reset() {
		this.printerStatusSpan.textContent = "Unknown";
		this.installBoardFilesButton.disabled = true;
		this.restartBoardButton.style.display = "none";
		this.boardFileStatus.textContent = "";
		this.boardFileStatus.className = "";
		this.boardFileProgress.style.display = "none";
		this.boardFileLog.replaceChildren();
		this.screenFirmwareContainer.style.display = "none";
		this.flashScreenFirmwareButton.disabled = false;
		this.screenFirmwareLog.replaceChildren();
		this.#setScreenFirmwareStatus("");

		for (const group of [...MACRO_GROUPS, "screen" as const]) {
			const span = this.#statusSpanFor(group);
			if (span) span.textContent = "Checking...";
		}
	}

	#statusSpanFor(group: BoardFileGroupName): HTMLSpanElement | null {
		return this.shadowRoot.getElementById(
			`${group}FileStatus`,
		) as HTMLSpanElement | null;
	}

	#appendLogLine(log: HTMLOListElement, text: string, ok: boolean) {
		const line = document.createElement("li");
		line.textContent = text;
		line.className = ok ? "board-file-ok" : "board-file-fail";
		log.appendChild(line);
		log.scrollTop = log.scrollHeight;
	}

	#setBoardFileStatus(message: string, isError = false) {
		this.boardFileStatus.textContent = message;
		this.boardFileStatus.className = isError ? "firmware-error" : "";
	}

	#setScreenFirmwareStatus(message: string, isError = false) {
		this.screenFirmwareStatus.textContent = message;
		this.screenFirmwareStatus.className = isError ? "firmware-error" : "";
	}

	#renderGroupStatuses(statuses: GroupStatus[]) {
		if (statuses.length === 0) {
			for (const group of MACRO_GROUPS) {
				const span = this.#statusSpanFor(group);
				if (span) span.textContent = "No files found. Probably needs a sync.";
			}
			return;
		}

		for (const status of statuses) {
			const span = this.#statusSpanFor(status.group);
			if (!span) continue;

			if (status.installedVersion === null) {
				span.textContent =
					status.group === "screen"
						? `Not flashed yet (v${status.bundledVersion} bundled)`
						: `Not installed (${status.fileCount} files to send, v${status.bundledVersion})`;
			} else if (status.needsUpdate) {
				span.textContent = `Update available: ${status.installedVersion} → ${status.bundledVersion}`;
			} else {
				span.textContent = `Up to date (v${status.installedVersion})`;
			}

			// The screen block only exists when a firmware binary is bundled; the
			// build omits the group entirely otherwise.
			if (status.group === "screen") {
				this.screenFirmwareContainer.style.display = "block";
				this.flashScreenFirmwareButton.value = status.needsUpdate
					? `Flash Screen Firmware (v${status.bundledVersion})`
					: `Reflash Screen Firmware (v${status.bundledVersion})`;
				this.#setScreenFirmwareStatus(
					status.needsUpdate
						? "The screen goes blank for up to a minute while it reflashes."
						: "Already up to date. Reflash only if the screen is misbehaving.",
				);
			}
		}
	}

	/**
	 * Reads the board's firmware version for display, then compares each
	 * board-file group's bundled package.json against the one installed on the
	 * SD card (fetched over rr_download).
	 */
	async checkBoardFileStatus() {
		try {
			const ipAddress = await getIpAddress();
			this.#renderGroupStatuses([]);

			if (!ipAddress) {
				this.printerStatusSpan.textContent = "No IP configured";
				this.#setBoardFileStatus("Set a printer IP address to check.");
				return;
			}

			this.printerStatusSpan.textContent = "Yes";
		} catch (error) {
			this.printerStatusSpan.textContent = "No";
			this.#setBoardFileStatus(
				`Not connected: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
			return;
		}

		try {
			const statuses = await checkBoardFileVersions();
			this.#groupStatuses = statuses;
			this.#renderGroupStatuses(statuses);

			// Screen firmware is reported and flashed separately, so it must not
			// enable or label the board files button.
			const outdated = statuses.filter(
				(status) => status.needsUpdate && MACRO_GROUPS.includes(status.group),
			);
			const neverInstalled = outdated.some(
				(status) => status.installedVersion === null,
			);

			this.installBoardFilesButton.disabled = outdated.length === 0;
			this.installBoardFilesButton.value = neverInstalled
				? "Install Board Files"
				: "Update Board Files";

			this.#setBoardFileStatus(
				outdated.length === 0
					? "All board files are up to date."
					: `${outdated.length} group(s) need updating.`,
			);
		} catch (error) {
			this.#groupStatuses = [];
			this.installBoardFilesButton.disabled = true;
			this.#setBoardFileStatus(
				`Could not check board files: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
		}
	}

	async performBoardFileInstall() {
		const groups = this.#groupStatuses
			.filter(
				(status) => status.needsUpdate && MACRO_GROUPS.includes(status.group),
			)
			.map((status) => status.group);

		if (groups.length === 0) return;

		const totalFiles = this.#groupStatuses
			.filter((status) => groups.includes(status.group))
			.reduce((sum, status) => sum + status.fileCount, 0);

		this.installBoardFilesButton.disabled = true;
		this.flashScreenFirmwareButton.disabled = true;
		this.restartBoardButton.style.display = "none";
		this.boardFileLog.replaceChildren();
		this.boardFileProgress.style.display = "block";
		this.boardFileProgress.value = 0;
		this.boardFileProgress.max = totalFiles;
		this.#setBoardFileStatus(`Uploading ${totalFiles} files...`);

		let completed = 0;

		const onProgress = (result: FileResult) => {
			completed += 1;
			this.boardFileProgress.value = completed;
			this.#appendLogLine(
				this.boardFileLog,
				result.ok
					? `${result.group}/${result.file} (${result.bytes} B, ${result.ms.toFixed(0)} ms)`
					: `${result.group}/${result.file} — ${result.error}`,
				result.ok,
			);
		};

		try {
			const summary = await installBoardFiles(groups, onProgress);

			this.#setBoardFileStatus(
				summary.failed === 0
					? `Uploaded ${summary.uploaded} files successfully.`
					: `Uploaded ${summary.uploaded} files, ${summary.failed} failed. See the log above and Download Logs for details.`,
				summary.failed > 0,
			);

			if (summary.restartRequired) {
				this.restartBoardButton.style.display = "inline-block";
				this.#appendLogLine(
					this.boardFileLog,
					"0:/sys changed — restart the board so config.g is re-read.",
					true,
				);
			}

			await this.checkBoardFileStatus();
		} catch (error) {
			this.#setBoardFileStatus(
				`Install failed: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
			this.installBoardFilesButton.disabled = false;
		} finally {
			this.boardFileProgress.style.display = "none";
			this.flashScreenFirmwareButton.disabled = false;
		}
	}

	#reportFlashOutcome(flash: FlashOutcome | null) {
		if (!flash) {
			this.#setScreenFirmwareStatus(
				"Firmware upload failed — the screen was not flashed. See the log above.",
				true,
			);
			return;
		}

		if (!flash.ok) {
			this.#appendLogLine(
				this.screenFirmwareLog,
				`M997 S4 ${flash.binary} — ${flash.error}`,
				false,
			);
			this.#setScreenFirmwareStatus(
				`Flash failed: ${flash.error}. The recorded version is unchanged, so you can try again.`,
				true,
			);
			return;
		}

		this.#appendLogLine(
			this.screenFirmwareLog,
			`M997 S4 ${flash.binary} — ${flash.reply || "accepted, no reply"}`,
			true,
		);
		this.#setScreenFirmwareStatus(
			"Flash sent. The screen reflashes and restarts on its own — leave the printer powered on until it comes back.",
		);
	}

	/**
	 * Uploads the bundled PanelDue binary and flashes it with M997 S4. Runs
	 * whatever the recorded version says, so a failed flash can be retried.
	 */
	async performScreenFirmwareFlash() {
		const screen = this.#groupStatuses.find(
			(status) => status.group === "screen",
		);

		if (!screen) return;

		if (
			!confirm(
				`Flash PanelDue firmware v${screen.bundledVersion} to the screen?\n\nThe screen goes blank for up to a minute. Do not power off the printer until it comes back.`,
			)
		) {
			return;
		}

		this.flashScreenFirmwareButton.disabled = true;
		this.installBoardFilesButton.disabled = true;
		this.screenFirmwareLog.replaceChildren();
		this.#setScreenFirmwareStatus("Uploading firmware to 0:/firmware...");

		const onProgress = (result: FileResult) => {
			this.#appendLogLine(
				this.screenFirmwareLog,
				result.ok
					? `${result.file} (${result.bytes} B, ${result.ms.toFixed(0)} ms)`
					: `${result.file} — ${result.error}`,
				result.ok,
			);

			if (result.ok && result.file.endsWith(".bin")) {
				this.#setScreenFirmwareStatus("Flashing the screen (M997 S4)...");
			}
		};

		try {
			const summary = await installBoardFiles(["screen"], onProgress);
			// Refresh first: re-reading the board rewrites the firmware status
			// line, so the outcome has to be written after it.
			await this.checkBoardFileStatus();
			this.#reportFlashOutcome(summary.screenFlash);
		} catch (error) {
			this.#setScreenFirmwareStatus(
				`Flash failed: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
		} finally {
			this.flashScreenFirmwareButton.disabled = false;
		}
	}

	async performBoardRestart() {
		this.restartBoardButton.disabled = true;
		this.#setBoardFileStatus("Restarting board (M999)...");

		try {
			await restartBoard();
			this.#setBoardFileStatus(
				"Restart sent. The board will be offline for a few seconds.",
			);
		} catch (error) {
			this.#setBoardFileStatus(
				`Restart failed: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
		} finally {
			this.restartBoardButton.disabled = false;
		}
	}
}

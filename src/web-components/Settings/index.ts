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
import { sendGCodeFile } from "@/3d/printerApi";
import {
	getCircularSegments,
	getEPerRevolution,
	getLineWidthAdjustment,
	getSecondsPerLayer,
	getStartingCupLayerHeight,
	getTestCylinderHeight,
	getTestCylinderInnerDiameter,
	setCircularSegments,
	setEPerRevolution,
	setLineWidthAdjustment,
	setSecondsPerLayer,
	setStartingCupLayerHeight,
	setTestCylinderHeight,
	setTestCylinderInnerDiameter,
} from "@/db/appSettingsDbActions";
import { deleteDb } from "@/db/db";
import { getIpAddress } from "@/db/formValuesDbActions";
import { downloadLogs } from "@/utils/logInterceptor";

import { Dialog } from "../Dialog";
import styles from "./Settings.css?inline";
import template from "./Settings.html?raw";

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

type Theme = "dark" | "light" | "system";

const THEME_STORAGE_KEY = "app-theme";

// The macro groups install together; the screen firmware is flashed on its own
// so an operator never reflashes the PanelDue just to push a macro change.
const MACRO_GROUPS: BoardFileGroupName[] = ["system", "provel"];

export function initializeTheme(): void {
	const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
	const theme: Theme = storedTheme ?? "dark";
	document.documentElement.setAttribute("data-theme", theme);
}

function setTheme(theme: Theme): void {
	localStorage.setItem(THEME_STORAGE_KEY, theme);
	document.documentElement.setAttribute("data-theme", theme);
}

function getTheme(): Theme {
	return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) ?? "dark";
}

export class Settings extends Dialog {
	resetButton: HTMLButtonElement;
	downloadLogsButton: HTMLButtonElement;
	testCylinderForm: HTMLFormElement;
	closeButton: HTMLButtonElement;
	themeSelect: HTMLSelectElement;
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
	extrusionTestGcodeButton: HTMLButtonElement;
	extrusionTestStatus: HTMLParagraphElement;
	#groupStatuses: GroupStatus[] = [];

	constructor() {
		super();
		this.id = "settingsDialog";
		this.attachHTML(template, sheet);

		this.form = this.shadowRoot.getElementById(
			"settingsForm",
		) as HTMLFormElement;
		this.resetButton = this.shadowRoot.getElementById(
			"resetApp",
		) as HTMLButtonElement;
		this.downloadLogsButton = this.shadowRoot.getElementById(
			"downloadLogs",
		) as HTMLButtonElement;
		this.testCylinderForm = this.shadowRoot.getElementById(
			"testCylinderSettings",
		) as HTMLFormElement;
		this.closeButton = this.shadowRoot.getElementById(
			"closeSettings",
		) as HTMLButtonElement;
		this.themeSelect = this.shadowRoot.getElementById(
			"themeSelect",
		) as HTMLSelectElement;
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
		this.extrusionTestGcodeButton = this.shadowRoot.getElementById(
			"extrusionTestGcode",
		) as HTMLButtonElement;
		this.extrusionTestStatus = this.shadowRoot.getElementById(
			"extrusionTestStatus",
		) as HTMLParagraphElement;

		this.dialogEvents();
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

	#setExtrusionTestStatus(message: string, isError = false) {
		this.extrusionTestStatus.textContent = message;
		this.extrusionTestStatus.className = isError ? "firmware-error" : "";
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

	/**
	 * Uploads the bundled extrusion linearity test to the board's gcodes folder.
	 * Like the main Print button, this only uploads — the operator starts the
	 * job from the printer's own screen.
	 */
	async sendExtrusionTestGcode() {
		const ipAddress = await getIpAddress();

		if (!ipAddress) {
			this.#setExtrusionTestStatus("Set a printer IP address first.", true);
			return;
		}

		this.extrusionTestGcodeButton.disabled = true;
		this.#setExtrusionTestStatus("Uploading extrusion test...");

		try {
			const response = await fetch("/extrusion_test.gcode", {
				cache: "no-cache",
			});

			if (!response.ok) {
				throw new Error(
					`Could not read the bundled test file: HTTP ${response.status}`,
				);
			}

			await sendGCodeFile(await response.blob(), "extrusion_test.gcode");

			this.#setExtrusionTestStatus(
				"Uploaded to 0:/gcodes/extrusion_test.gcode. Start it from the printer screen.",
			);
		} catch (error) {
			this.#setExtrusionTestStatus(
				`Upload failed: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
		} finally {
			this.extrusionTestGcodeButton.disabled = false;
		}
	}

	async showSettings() {
		await this.loadDataIntoForm();
		this.themeSelect.value = getTheme();

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
		this.#setExtrusionTestStatus("");

		for (const group of [...MACRO_GROUPS, "screen" as const]) {
			const span = this.#statusSpanFor(group);
			if (span) span.textContent = "Checking...";
		}

		this.show();
		this.checkBoardFileStatus();
	}

	dialogEvents() {
		this.form.addEventListener("submit", this.saveSettings);
		// Separate form for test cylinder dimensions; prevent full dialog close
		this.testCylinderForm.addEventListener("submit", (evt) =>
			this.saveTestCylinderSettings(evt),
		);

		this.closeButton.addEventListener("click", () => this.hide());
		this.dialog.addEventListener("close", () => this.hide());
		this.resetButton.addEventListener("click", () => this.resetApplication());
		this.downloadLogsButton.addEventListener("click", () => downloadLogs());
		this.themeSelect.addEventListener("change", () => {
			setTheme(this.themeSelect.value as Theme);
		});
		this.installBoardFilesButton.addEventListener("click", () =>
			this.performBoardFileInstall(),
		);
		this.flashScreenFirmwareButton.addEventListener("click", () =>
			this.performScreenFirmwareFlash(),
		);
		this.restartBoardButton.addEventListener("click", () =>
			this.performBoardRestart(),
		);
		this.extrusionTestGcodeButton.addEventListener("click", () =>
			this.sendExtrusionTestGcode(),
		);
	}

	async resetApplication() {
		if (
			confirm(
				"Are you sure you want to reset the application? This will delete all your data and settings!",
			)
		) {
			await deleteDb();
			location.reload();
		}
	}

	async saveSettings(e: SubmitEvent) {
		const settingsForm = new FormData(e.target as HTMLFormElement);
		const tasks: Promise<unknown>[] = [];

		const startingCupLayerHeightVal = Number(
			settingsForm.get("startingCupLayerHeight"),
		);
		if (!Number.isNaN(startingCupLayerHeightVal)) {
			tasks.push(setStartingCupLayerHeight(startingCupLayerHeightVal));
		}

		const lineWidthAdjustmentVal = Number(
			settingsForm.get("lineWidthAdjustment"),
		);
		if (!Number.isNaN(lineWidthAdjustmentVal)) {
			tasks.push(setLineWidthAdjustment(lineWidthAdjustmentVal));
		}

		const circularSegmentsVal = Number(settingsForm.get("circularResolution"));
		if (!Number.isNaN(circularSegmentsVal)) {
			tasks.push(setCircularSegments(circularSegmentsVal));
		}

		const secondsPerLayerRaw = settingsForm.get("secondsPerLayer");
		if (secondsPerLayerRaw !== null && secondsPerLayerRaw !== "") {
			const secondsPerLayerVal = Number(secondsPerLayerRaw);
			if (!Number.isNaN(secondsPerLayerVal) && secondsPerLayerVal > 0) {
				tasks.push(setSecondsPerLayer(secondsPerLayerVal));
			}
		}

		const ePerRevolutionVal = Number(settingsForm.get("ePerRevolution"));
		if (!Number.isNaN(ePerRevolutionVal)) {
			tasks.push(setEPerRevolution(ePerRevolutionVal));
		}

		if (tasks.length) {
			await Promise.all(tasks);
		}
	}

	async saveTestCylinderSettings(evt: Event) {
		evt.preventDefault();

		const formData = new FormData(this.testCylinderForm);
		const settings = Object.fromEntries(formData.entries());

		await Promise.all([
			setTestCylinderHeight(+settings.testCylinderHeight),
			setTestCylinderInnerDiameter(+settings.testCylinderInnerDiameter),
		]);
	}

	async loadDataIntoForm() {
		const [
			startingCupLayerHeight,
			lineWidthAdjustment,
			circularSegments,
			testCylinderHeight,
			testCylinderInnerDiameter,
			secondsPerLayer,
			ePerRevolution,
		] = await Promise.all([
			getStartingCupLayerHeight(),
			getLineWidthAdjustment(),
			getCircularSegments(),
			getTestCylinderHeight(),
			getTestCylinderInnerDiameter(),
			getSecondsPerLayer(),
			getEPerRevolution(),
		]);

		const mainSettingMap: Record<string, number | boolean> = {
			startingCupLayerHeight,
			lineWidthAdjustment,
			circularResolution: circularSegments,
			secondsPerLayer,
			ePerRevolution,
			testCylinderHeight,
			testCylinderInnerDiameter,
		};

		Object.entries(mainSettingMap).forEach(([key, value]) => {
			const input = this.shadowRoot.querySelector(
				`#${key}`,
			) as HTMLInputElement;

			if (input && input.type === "checkbox") {
				input.checked = Boolean(value);
			} else if (input) {
				input.value = value.toString();
			} else {
				console.warn(
					`Input element with id "${key}" not found in settings form.`,
				);
			}
		});
	}
}

customElements.define("app-settings", Settings);

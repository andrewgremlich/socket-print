import {
	type BoardFileGroupName,
	checkBoardFileVersions,
	type FileResult,
	type GroupStatus,
	installBoardFiles,
	restartBoard,
} from "@/3d/boardFiles";
import { getBoardInfo } from "@/3d/printerApi";
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
	firmwareVersionSpan: HTMLSpanElement;
	printerStatusSpan: HTMLSpanElement;
	screenFirmwareRow: HTMLParagraphElement;
	installBoardFilesButton: HTMLButtonElement;
	restartBoardButton: HTMLButtonElement;
	boardFileStatus: HTMLParagraphElement;
	boardFileProgress: HTMLProgressElement;
	boardFileLog: HTMLOListElement;
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
		this.firmwareVersionSpan = this.shadowRoot.getElementById(
			"firmwareVersion",
		) as HTMLSpanElement;
		this.printerStatusSpan = this.shadowRoot.getElementById(
			"printerStatus",
		) as HTMLSpanElement;
		this.screenFirmwareRow = this.shadowRoot.getElementById(
			"screenFirmwareRow",
		) as HTMLParagraphElement;
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

		this.dialogEvents();
	}

	#statusSpanFor(group: BoardFileGroupName): HTMLSpanElement | null {
		return this.shadowRoot.getElementById(
			`${group}FileStatus`,
		) as HTMLSpanElement | null;
	}

	#appendLogLine(text: string, ok: boolean) {
		const line = document.createElement("li");
		line.textContent = text;
		line.className = ok ? "board-file-ok" : "board-file-fail";
		this.boardFileLog.appendChild(line);
		this.boardFileLog.scrollTop = this.boardFileLog.scrollHeight;
	}

	#setBoardFileStatus(message: string, isError = false) {
		this.boardFileStatus.textContent = message;
		this.boardFileStatus.className = isError ? "firmware-error" : "";
	}

	#renderGroupStatuses(statuses: GroupStatus[]) {
		for (const status of statuses) {
			const span = this.#statusSpanFor(status.group);
			if (!span) continue;

			if (status.installedVersion === null) {
				span.textContent = `Not installed (${status.fileCount} files to send, v${status.bundledVersion})`;
			} else if (status.needsUpdate) {
				span.textContent = `Update available: ${status.installedVersion} → ${status.bundledVersion}`;
			} else {
				span.textContent = `Up to date (v${status.installedVersion})`;
			}

			if (status.group === "screen") {
				this.screenFirmwareRow.style.display = "block";
			}
		}

		// Groups with nothing bundled never come back from the version check.
		const reported = new Set(statuses.map((status) => status.group));
		for (const group of ["system", "provel"] as BoardFileGroupName[]) {
			if (reported.has(group)) continue;
			const span = this.#statusSpanFor(group);
			if (span) span.textContent = "No files bundled with this app version";
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

			if (!ipAddress) {
				this.printerStatusSpan.textContent = "No IP configured";
				this.firmwareVersionSpan.textContent = "—";
				this.#setBoardFileStatus("Set a printer IP address to check.");
				this.#renderGroupStatuses([]);
				return;
			}

			const boardInfo = await getBoardInfo();
			this.printerStatusSpan.textContent = "Yes";
			this.firmwareVersionSpan.textContent = boardInfo.firmwareVersion;
		} catch (error) {
			this.printerStatusSpan.textContent = "No";
			this.firmwareVersionSpan.textContent = "—";
			this.#setBoardFileStatus(
				`Not connected: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
			this.#renderGroupStatuses([]);
			return;
		}

		try {
			const statuses = await checkBoardFileVersions();
			this.#groupStatuses = statuses;
			this.#renderGroupStatuses(statuses);

			const outdated = statuses.filter((status) => status.needsUpdate);
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
			.filter((status) => status.needsUpdate)
			.map((status) => status.group);

		if (groups.length === 0) return;

		const totalFiles = this.#groupStatuses
			.filter((status) => groups.includes(status.group))
			.reduce((sum, status) => sum + status.fileCount, 0);

		this.installBoardFilesButton.disabled = true;
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

	async showSettings() {
		await this.loadDataIntoForm();
		this.themeSelect.value = getTheme();

		this.printerStatusSpan.textContent = "Unknown";
		this.firmwareVersionSpan.textContent = "Checking...";
		this.installBoardFilesButton.disabled = true;
		this.restartBoardButton.style.display = "none";
		this.boardFileStatus.textContent = "";
		this.boardFileStatus.className = "";
		this.boardFileProgress.style.display = "none";
		this.boardFileLog.replaceChildren();
		this.screenFirmwareRow.style.display = "none";

		for (const group of [
			"system",
			"provel",
			"screen",
		] as BoardFileGroupName[]) {
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
		this.restartBoardButton.addEventListener("click", () =>
			this.performBoardRestart(),
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

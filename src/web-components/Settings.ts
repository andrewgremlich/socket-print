import {
	type GitHubRelease,
	getBoardInfo,
	getLatestFirmwareRelease,
	isNewerVersion,
	pollUntilOnline,
	triggerFirmwareFlash,
	uploadFirmwareFile,
} from "@/3d/printerApi";
import {
	getCircularSegments,
	getEPerRevolution,
	getLineWidthAdjustment,
	getSecondsPerLayer,
	getStartingCupLayerHeight,
	getTestCylinderHeight,
	getTestCylinderInnerDiameter,
	getUseSecondsPerLayer,
	setCircularSegments,
	setEPerRevolution,
	setLineWidthAdjustment,
	setSecondsPerLayer,
	setStartingCupLayerHeight,
	setTestCylinderHeight,
	setTestCylinderInnerDiameter,
	setUseSecondsPerLayer,
} from "@/db/appSettingsDbActions";
import { deleteDb } from "@/db/db";
import { getIpAddress } from "@/db/formValuesDbActions";
import { downloadLogs } from "@/utils/logInterceptor";

import { Dialog } from "./Dialog";

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
	firmwareUpdateContainer: HTMLDivElement;
	updateFirmwareButton: HTMLButtonElement;
	firmwareUpdateStatus: HTMLParagraphElement;
	firmwareUpdateProgress: HTMLProgressElement;
	updateStatusSpan: HTMLSpanElement;
	#latestRelease: GitHubRelease | null = null;
	#currentIpAddress: string | null = null;

	constructor() {
		super();
		this.id = "settingsDialog";
		this.attachHTML`
			<style>
				dialog h3 {
					font-size: 1.5rem;
					margin-bottom: 1rem;
				}

				dialog h4 {
					font-size: 1.2rem;
					margin-bottom: 0.75rem;
				}

				dialog form {
					margin-bottom: 1.5rem;
				}

				#resetAppContainer {
					margin-top: 2rem;
					margin-bottom: 2rem;

					& h4 {
						margin-bottom: 0.5rem;
					}
				}

				#resetWarning {
					color: var(--text-error);
				}

				#themeContainer {
					display: flex;
					align-items: center;
					gap: 1rem;
					margin-bottom: 1.5rem;
				}

				#themeContainer label {
					margin-bottom: 0;
				}

				#firmwareUpdateContainer input[type="button"]:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}

				.firmware-error {
					color: var(--text-error);
				}
			</style>
			<dialog id="${this.id}" aria-labelledby="settingsTitle">
				<h3 id="settingsTitle">Settings</h3>

				<h4>Printer</h4>
				<p>Is connected: <span id="printerStatus">Unknown</span></p>
				<p>Firmware version: <span id="firmwareVersion">Checking...</span></p>
				<p>Update status: <span id="updateStatus">Checking...</span></p>
				<div id="firmwareUpdateContainer" style="display: none; margin-top: 0.5rem;">
					<input type="button" class="button" id="updateFirmwareButton" value="Update Firmware" />
					<p id="firmwareUpdateStatus" style="margin-top: 0.25rem; font-size: 0.85rem;"></p>
					<progress id="firmwareUpdateProgress" value="0" max="100" style="display: none; width: 100%; margin-top: 0.25rem;"></progress>
				</div>

				<h4>Appearance</h4>
				<div id="themeContainer">
					<label for="themeSelect">Theme</label>
					<select id="themeSelect" name="theme">
						<option value="dark">Dark</option>
						<option value="light">Light</option>
						<option value="system">System</option>
					</select>
				</div>

				<h4>GCode Generation Factors</h4>

				<form id="settingsForm" method="dialog">
					<label for="startingCupLayerHeight">Starting Cup Layer Height</label>
					<input type="number" id="startingCupLayerHeight" name="startingCupLayerHeight" step="0.1" min="1" max="4" />

					<label for="lineWidthAdjustment">Layer width adjustment</label>
					<input type="number" id="lineWidthAdjustment" name="lineWidthAdjustment" step="0.1" min="1" max="2" />

					<label for="circularResolution">Circular Resolution</label>
					<input type="number" id="circularResolution" name="circularResolution" step="1" min="100" max="300" />

					<label for="ePerRevolution">E Per Revolution</label>
					<input type="number" id="ePerRevolution" name="ePerRevolution" step="0.1" min="10" max="50" />

					<label for="secondsPerLayer">Seconds Per Layer</label>
					<input type="number" id="secondsPerLayer" name="secondsPerLayer" step="1" min="6" max="14" />

					<label for="useSecondsPerLayer">Use Seconds Per Layer</label>
					<input type="checkbox" id="useSecondsPerLayer" name="useSecondsPerLayer" />

					<input type="submit" value="Save" class="button" id="saveSettings" />
				</form>

				<h4>Test Cylinder Dimensions</h4>
				<form id="testCylinderSettings">
					<label for="testCylinderHeight">Test Cylinder Height</label>
					<input type="number" id="testCylinderHeight" name="testCylinderHeight" step="1" min="10" max="100" />

					<label for="testCylinderInnerDiameter">Test Cylinder Inner Diameter</label>
					<input type="number" id="testCylinderInnerDiameter" name="testCylinderInnerDiameter" step="1" min="70" max="80" />

					<input type="submit" value="Update Test Cylinder" class="button" id="updateTestCylinder" />
				</form>

				<div id="resetAppContainer">
					<h4>Application Help</h4>
					<input type="button" class="button" id="downloadLogs" value="Download Logs" />
					<input type="button" class="button" id="resetApp" value="Reset Application" aria-describedby="resetWarning" />
				</div>

				<div id="closeContainer" style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
					<input type="button" class="button" id="closeSettings" value="Close" />
				</div>
			</dialog>
		`;

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
		this.firmwareUpdateContainer = this.shadowRoot.getElementById(
			"firmwareUpdateContainer",
		) as HTMLDivElement;
		this.updateFirmwareButton = this.shadowRoot.getElementById(
			"updateFirmwareButton",
		) as HTMLButtonElement;
		this.firmwareUpdateStatus = this.shadowRoot.getElementById(
			"firmwareUpdateStatus",
		) as HTMLParagraphElement;
		this.firmwareUpdateProgress = this.shadowRoot.getElementById(
			"firmwareUpdateProgress",
		) as HTMLProgressElement;
		this.updateStatusSpan = this.shadowRoot.getElementById(
			"updateStatus",
		) as HTMLSpanElement;

		this.dialogEvents();
	}

	async checkPrinterFirmwareVersion() {
		const printerStatusSpan = this.shadowRoot.getElementById(
			"printerStatus",
		) as HTMLSpanElement;

		try {
			const ipAddress = await getIpAddress();
			this.#currentIpAddress = ipAddress;

			if (!ipAddress) {
				printerStatusSpan.textContent = "No IP configured";
				this.firmwareVersionSpan.textContent = "—";
				this.updateStatusSpan.textContent = "Not connected";
				return;
			}

			const boardInfo = await getBoardInfo();
			printerStatusSpan.textContent = "Yes";
			this.firmwareVersionSpan.textContent = boardInfo.firmwareVersion;

			try {
				const latestRelease = await getLatestFirmwareRelease();
				this.#latestRelease = latestRelease;

				if (isNewerVersion(boardInfo.firmwareVersion, latestRelease.tag_name)) {
					this.updateStatusSpan.textContent = `Update available: v${latestRelease.tag_name}`;
					this.firmwareUpdateContainer.style.display = "block";
				} else {
					this.updateStatusSpan.textContent = "Up to date";
				}
			} catch {
				this.updateStatusSpan.textContent = "Could not check for updates";
			}
		} catch {
			printerStatusSpan.textContent = "No";
			this.firmwareVersionSpan.textContent = "—";
			this.updateStatusSpan.textContent = "Not connected";
		}
	}

	async performFirmwareUpdate() {
		if (!this.#latestRelease || !this.#currentIpAddress) return;

		const FIRMWARE_FILE = "Duet3Firmware_MB6XD.bin";

		const setStatus = (msg: string, isError = false) => {
			this.firmwareUpdateStatus.textContent = msg;
			this.firmwareUpdateStatus.className = isError ? "firmware-error" : "";
		};

		this.updateFirmwareButton.disabled = true;
		this.firmwareUpdateProgress.style.display = "block";
		this.firmwareUpdateProgress.value = 0;

		try {
			const asset = this.#latestRelease.assets.find(
				(a) => a.name === FIRMWARE_FILE,
			);

			if (!asset) {
				throw new Error(`Required file not found in release: ${FIRMWARE_FILE}`);
			}

			setStatus(`Downloading ${FIRMWARE_FILE}...`);
			const downloadResponse = await fetch(asset.browser_download_url);
			if (!downloadResponse.ok) {
				throw new Error(`Failed to download ${FIRMWARE_FILE}`);
			}
			const fileData = await downloadResponse.arrayBuffer();

			setStatus(`Uploading ${FIRMWARE_FILE} to printer...`);
			await uploadFirmwareFile(this.#currentIpAddress, FIRMWARE_FILE, fileData);
			this.firmwareUpdateProgress.value = 70;

			setStatus("Triggering firmware flash (M997)...");
			await triggerFirmwareFlash(this.#currentIpAddress);
			this.firmwareUpdateProgress.value = 85;

			setStatus("Waiting for printer to reboot...");
			await pollUntilOnline(this.#currentIpAddress);
			this.firmwareUpdateProgress.value = 100;

			setStatus("Firmware update complete. Refreshing status...");
			await this.checkPrinterFirmwareVersion();
			this.firmwareUpdateProgress.style.display = "none";
		} catch (error) {
			setStatus(
				`Update failed: ${error instanceof Error ? error.message : String(error)}`,
				true,
			);
			this.updateFirmwareButton.disabled = false;
			this.firmwareUpdateProgress.style.display = "none";
		}
	}

	async showSettings() {
		await this.loadDataIntoForm();
		this.themeSelect.value = getTheme();

		const printerStatusSpan = this.shadowRoot.getElementById(
			"printerStatus",
		) as HTMLSpanElement;
		printerStatusSpan.textContent = "Unknown";
		this.firmwareVersionSpan.textContent = "Checking...";
		this.updateStatusSpan.textContent = "Checking...";
		this.firmwareUpdateContainer.style.display = "none";
		this.firmwareUpdateStatus.textContent = "";
		this.firmwareUpdateProgress.style.display = "none";

		this.show();
		this.checkPrinterFirmwareVersion();
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
		this.updateFirmwareButton.addEventListener("click", () =>
			this.performFirmwareUpdate(),
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

		const secondsPerLayerVal = Number(settingsForm.get("secondsPerLayer"));
		if (!Number.isNaN(secondsPerLayerVal)) {
			tasks.push(setSecondsPerLayer(secondsPerLayerVal));
		}

		const useSecondsPerLayerVal =
			settingsForm.get("useSecondsPerLayer") === "on";
		console.log("Saving useSecondsPerLayer:", useSecondsPerLayerVal);
		tasks.push(setUseSecondsPerLayer(useSecondsPerLayerVal));

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
			useSecondsPerLayer,
			ePerRevolution,
		] = await Promise.all([
			getStartingCupLayerHeight(),
			getLineWidthAdjustment(),
			getCircularSegments(),
			getTestCylinderHeight(),
			getTestCylinderInnerDiameter(),
			getSecondsPerLayer(),
			getUseSecondsPerLayer(),
			getEPerRevolution(),
		]);

		const mainSettingMap: Record<string, number | boolean> = {
			startingCupLayerHeight,
			lineWidthAdjustment,
			circularResolution: circularSegments,
			secondsPerLayer,
			useSecondsPerLayer,
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

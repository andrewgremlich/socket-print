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

import { Dialog } from "../Dialog";

type Theme = "dark" | "light" | "system";

const THEME_STORAGE_KEY = "app-theme";

export function initializeTheme(): void {
	const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
	const theme: Theme = storedTheme ?? "dark";
	document.documentElement.setAttribute("data-theme", theme);
}

export function setTheme(theme: Theme): void {
	localStorage.setItem(THEME_STORAGE_KEY, theme);
	document.documentElement.setAttribute("data-theme", theme);
}

export function getTheme(): Theme {
	return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) ?? "dark";
}

export class Settings extends Dialog {
	resetButton: HTMLButtonElement;
	testCylinderForm: HTMLFormElement;
	closeButton: HTMLButtonElement;
	themeSelect: HTMLSelectElement;

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
			</style>
			<dialog id="${this.id}" aria-labelledby="settingsTitle">
				<h3 id="settingsTitle">Settings</h3>

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
					<!--
					<label for="startingCupLayerHeight">Starting Cup Layer Height</label>
					<input type="number" id="startingCupLayerHeight" name="startingCupLayerHeight" step="0.1" min="1" max="4" />

					<label for="lineWidthAdjustment">Line Width Adjustment</label>
					<input type="number" id="lineWidthAdjustment" name="lineWidthAdjustment" step="0.1" min="1" max="2" />

					<label for="circularResolution">Circular Resolution</label>
					<input type="number" id="circularResolution" name="circularResolution" step="1" min="100" max="150" />
					-->

					<label for="ePerRevolution">E Per Revolution</label>
					<input type="number" id="ePerRevolution" name="ePerRevolution" step="0.1" min="10" max="50" />

					<label for="secondsPerLayer">Seconds Per Layer</label>
					<input type="number" id="secondsPerLayer" name="secondsPerLayer" step="1" min="6" max="14" />

					<input type="submit" value="Save" class="button" id="saveSettings" />
				</form>

				<h4>Test Cylinder Dimensions</h4>
				<form id="testCylinderSettings">
					<label for="testCylinderHeight">Test Cylinder Height</label>
					<input type="number" id="testCylinderHeight" name="testCylinderHeight" step="1" min="10" max="50" />

					<label for="testCylinderInnerDiameter">Test Cylinder Inner Diameter</label>
					<input type="number" id="testCylinderInnerDiameter" name="testCylinderInnerDiameter" step="1" min="70" max="80" />

					<input type="submit" value="Update Test Cylinder" class="button" id="updateTestCylinder" />
				</form>

				<div id="resetAppContainer">
					<h4>Reset Application</h4>
					<input type="button" class="button" id="resetApp" value="Reset Application" aria-describedby="resetWarning" />
					<p id="resetWarning">This will delete all your data and settings!</p>
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
		this.testCylinderForm = this.shadowRoot.getElementById(
			"testCylinderSettings",
		) as HTMLFormElement;
		this.closeButton = this.shadowRoot.getElementById(
			"closeSettings",
		) as HTMLButtonElement;
		this.themeSelect = this.shadowRoot.getElementById(
			"themeSelect",
		) as HTMLSelectElement;

		this.dialogEvents();
	}

	async showSettings() {
		await this.loadDataIntoForm();
		this.themeSelect.value = getTheme();
		this.show();
	}

	dialogEvents() {
		this.form.addEventListener("submit", () => this.saveSettings());
		// Separate form for test cylinder dimensions; prevent full dialog close
		this.testCylinderForm.addEventListener("submit", (evt) =>
			this.saveTestCylinderSettings(evt),
		);

		this.closeButton.addEventListener("click", () => this.hide());
		this.dialog.addEventListener("close", () => this.hide());
		this.resetButton.addEventListener("click", () => this.resetApplication());
		this.themeSelect.addEventListener("change", () => {
			setTheme(this.themeSelect.value as Theme);
		});
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

	async saveSettings() {
		const formData = new FormData(this.form);
		const settings = Object.fromEntries(formData.entries());

		const tasks: Promise<unknown>[] = [];

		const startingCupLayerHeightVal = Number(settings.startingCupLayerHeight);
		if (!Number.isNaN(startingCupLayerHeightVal)) {
			tasks.push(setStartingCupLayerHeight(startingCupLayerHeightVal));
		}

		const lineWidthAdjustmentVal = Number(settings.lineWidthAdjustment);
		if (!Number.isNaN(lineWidthAdjustmentVal)) {
			tasks.push(setLineWidthAdjustment(lineWidthAdjustmentVal));
		}

		const circularSegmentsVal = Number(settings.circularResolution);
		if (!Number.isNaN(circularSegmentsVal)) {
			tasks.push(setCircularSegments(circularSegmentsVal));
		}

		const secondsPerLayerVal = Number(settings.secondsPerLayer);
		if (!Number.isNaN(secondsPerLayerVal)) {
			tasks.push(setSecondsPerLayer(secondsPerLayerVal));
		}

		const ePerRevolutionVal = Number(settings.ePerRevolution);
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

		const mainSettingMap: Record<string, number> = {
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

			if (input) input.value = value.toString();
		});
	}
}

customElements.define("app-settings", Settings);

import {
	getCircularSegments,
	getEPerRevolution,
	getLineWidthAdjustment,
	getSecondsPerLayer,
	getStartingCupLayerHeight,
	getTestCylinderDiameter,
	getTestCylinderHeight,
	setCircularSegments,
	setEPerRevolution,
	setLineWidthAdjustment,
	setSecondsPerLayer,
	setStartingCupLayerHeight,
	setTestCylinderHeight,
	settestCylinderDiameter,
} from "@/db/appSettingsDbActions";
import { deleteDb } from "@/db/db";
import { getNozzleSize } from "@/db/formValuesDbActions";

import { Dialog } from "../Dialog";

export class Settings extends Dialog {
	resetButton: HTMLButtonElement;
	testCylinderForm: HTMLFormElement;
	closeButton: HTMLButtonElement;

	constructor() {
		super();
		this.id = "settingsDialog";
		this.attachHTML`
			<style>
				#resetAppContainer {
					margin-top: 2rem;
					margin-bottom: 2rem;

					& h4 {
						margin-bottom: 0.5rem;
					}
				}

				.greyedOut {
					margin-top: 0.5rem;
					font-size: 0.9em;
					color:#666;
				}
			</style>
		  <dialog id="${this.id}">
		    <h3>Settings</h3>
        	<form id="settingsForm" method="dialog">
            <!--<label for="startingCupLayerHeight">Starting Cup Layer Height</label>
            <input type="number" id="startingCupLayerHeight" name="startingCupLayerHeight" step="0.1" min="1" max="4" />-->

            <!--<label for="lineWidthAdjustment">Line Width Adjustment</label>
            <input type="number" id="lineWidthAdjustment" name="lineWidthAdjustment" step="0.1" min="1" max="2" />-->

						<!--<label for="circularResolution">Circular Resolution</label>
						<input type="number" id="circularResolution" name="circularResolution" step="1" min="100" max="150" />-->

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

						<label for="testCylinderDiameter">Test Cylinder Diameter</label>
						<input type="number" id="testCylinderDiameter" name="testCylinderDiameter" step="1" min="70" max="80" />

						<p class="greyedOut">Calculated Inner Diameter:</p>
						<p class="greyedOut"><span id="calculatedInnerDiameter">--</span> mm</p>

						<input type="submit" value="Update Test Cylinder" class="button" id="updateTestCylinder" />
					</form>
					<div id="resetAppContainer">
						<h4>Reset Application</h4>
						<input type="button" class="button" id="resetApp" value="Reset Application" />
					</div>
					<div id="closeContainer" style="margin-top:1.5rem;display:flex;justify-content:flex-end;">
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

		this.dialogEvents();
	}

	async showSettings() {
		await this.loadDataIntoForm();
		this.show();
	}

	dialogEvents() {
		this.form.addEventListener("submit", () => this.saveSettings());
		// Separate form for test cylinder dimensions; prevent full dialog close
		this.testCylinderForm.addEventListener("submit", (evt) =>
			this.saveTestCylinderSettings(evt),
		);

		const testDiameterInput = this.testCylinderForm.elements.namedItem(
			"testCylinderDiameter",
		) as HTMLInputElement;
		if (testDiameterInput) {
			testDiameterInput.addEventListener("input", () =>
				this.updateCalculatedInnerDiameter(),
			);
		}

		this.closeButton.addEventListener("click", () => this.hide());
		this.dialog.addEventListener("close", () => this.hide());
		this.resetButton.addEventListener("click", () => this.resetApplication());
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
			settestCylinderDiameter(+settings.testCylinderDiameter),
		]);
	}

	async updateCalculatedInnerDiameter() {
		const testDiameterInput = this.testCylinderForm.elements.namedItem(
			"testCylinderDiameter",
		) as HTMLInputElement;
		const nozzleSize = await getNozzleSize();
		const diameter = Number(testDiameterInput.value);
		const innerDiameter = diameter - nozzleSize;
		const innerDiameterSpan = this.shadowRoot.getElementById(
			"calculatedInnerDiameter",
		);
		if (innerDiameterSpan)
			innerDiameterSpan.textContent = innerDiameter.toFixed(2);
	}

	async loadDataIntoForm() {
		const [
			startingCupLayerHeight,
			lineWidthAdjustment,
			circularSegments,
			testCylinderHeight,
			testCylinderDiameter,
			secondsPerLayer,
			ePerRevolution,
			nozzleSize,
		] = await Promise.all([
			getStartingCupLayerHeight(),
			getLineWidthAdjustment(),
			getCircularSegments(),
			getTestCylinderHeight(),
			getTestCylinderDiameter(),
			getSecondsPerLayer(),
			getEPerRevolution(),
			getNozzleSize(),
		]);

		const mainSettingMap: Record<string, number> = {
			startingCupLayerHeight,
			lineWidthAdjustment,
			circularResolution: circularSegments,
			secondsPerLayer,
			ePerRevolution,
		};

		Object.entries(mainSettingMap).forEach(([key, value]) => {
			const input = this.form.elements.namedItem(
				key,
			) as HTMLInputElement | null;
			if (input) input.value = value.toString();
		});

		// Test cylinder form inputs
		const testHeightInput = this.testCylinderForm.elements.namedItem(
			"testCylinderHeight",
		) as HTMLInputElement | null;
		const testDiameterInput = this.testCylinderForm.elements.namedItem(
			"testCylinderDiameter",
		) as HTMLInputElement | null;

		if (testHeightInput) testHeightInput.value = testCylinderHeight.toString();
		if (testDiameterInput)
			testDiameterInput.value = testCylinderDiameter.toString();

		const innerDiameter = testCylinderDiameter - nozzleSize;
		const innerDiameterSpan = this.shadowRoot.getElementById(
			"calculatedInnerDiameter",
		);
		if (innerDiameterSpan)
			innerDiameterSpan.textContent = innerDiameter.toFixed(2);
	}
}

customElements.define("app-settings", Settings);

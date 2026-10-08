import {
	getCircularSegments,
	getConstantSpeed,
	getEPerRevolution,
	getFanSpeed,
	getLineWidthAdjustment,
	getSecondsPerLayer,
	getStartingCupLayerHeight,
	getTestCylinderHeight,
	getTestCylinderInnerDiameter,
	getUseSecondsPerLayer,
	setCircularSegments,
	setConstantSpeed,
	setEPerRevolution,
	setFanSpeed,
	setLineWidthAdjustment,
	setSecondsPerLayer,
	setStartingCupLayerHeight,
	setTestCylinderHeight,
	setTestCylinderInnerDiameter,
	setUseSecondsPerLayer,
} from "@/db/appSettingsDbActions";

export class SettingsForms {
	form: HTMLFormElement;
	testCylinderForm: HTMLFormElement;
	useSecondsPerLayer: HTMLInputElement;

	constructor(private shadowRoot: ShadowRoot) {
		this.form = this.shadowRoot.getElementById(
			"settingsForm",
		) as HTMLFormElement;
		this.testCylinderForm = this.shadowRoot.getElementById(
			"testCylinderSettings",
		) as HTMLFormElement;
		this.useSecondsPerLayer = this.shadowRoot.getElementById(
			"useSecondsPerLayer",
		) as HTMLInputElement;
		this.form.addEventListener("submit", (evt) => this.saveSettings(evt));
		this.testCylinderForm.addEventListener("submit", (evt) =>
			this.saveTestCylinderSettings(evt),
		);
		this.useSecondsPerLayer.addEventListener("change", (evt) => {
			const value = (evt.currentTarget as HTMLInputElement).checked;
			setUseSecondsPerLayer(value);
		});
	}

	async saveSettings(e: SubmitEvent) {
		const settingsForm = new FormData(e.target as HTMLFormElement);
		const tasks: Promise<unknown>[] = [];

		const startingCupLayerHeightVal = Number(
			settingsForm.get("startingCupLayerHeight"),
		);
		tasks.push(setStartingCupLayerHeight(startingCupLayerHeightVal));

		const lineWidthAdjustmentVal = Number(
			settingsForm.get("lineWidthAdjustment"),
		);
		tasks.push(setLineWidthAdjustment(lineWidthAdjustmentVal));

		const circularSegmentsVal = Number(settingsForm.get("circularResolution"));
		tasks.push(setCircularSegments(circularSegmentsVal));

		const constantSpeed = Number(settingsForm.get("constantSpeed"));
		const secondsPerLayerVal = Number(settingsForm.get("secondsPerLayer"));

		tasks.push(setSecondsPerLayer(secondsPerLayerVal));
		tasks.push(setConstantSpeed(constantSpeed));

		const ePerRevolutionVal = Number(settingsForm.get("ePerRevolution"));
		tasks.push(setEPerRevolution(ePerRevolutionVal));

		const fanSpeed = Number(settingsForm.get("fanSpeed"));
		tasks.push(setFanSpeed(fanSpeed));

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
			useSecondsPerLayer,
			constantSpeed,
			fanSpeed,
		] = await Promise.all([
			getStartingCupLayerHeight(),
			getLineWidthAdjustment(),
			getCircularSegments(),
			getTestCylinderHeight(),
			getTestCylinderInnerDiameter(),
			getSecondsPerLayer(),
			getEPerRevolution(),
			getUseSecondsPerLayer(),
			getConstantSpeed(),
			getFanSpeed(),
		]);

		const mainSettingMap: Record<string, number | boolean> = {
			startingCupLayerHeight,
			lineWidthAdjustment,
			circularResolution: circularSegments,
			secondsPerLayer,
			ePerRevolution,
			testCylinderHeight,
			testCylinderInnerDiameter,
			constantSpeed,
			fanSpeed,
			useSecondsPerLayer,
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

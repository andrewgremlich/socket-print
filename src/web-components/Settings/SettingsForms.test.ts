import { beforeEach, expect, test, vi } from "vitest";
import * as settingsDb from "@/db/appSettingsDbActions";
import template from "./Settings.html?raw";
import { SettingsForms } from "./SettingsForms";

vi.mock("@/db/appSettingsDbActions");

let root: ShadowRoot;
let forms: SettingsForms;

beforeEach(() => {
	vi.resetAllMocks();
	root = document.createElement("div").attachShadow({ mode: "open" });
	root.innerHTML = template;
	forms = new SettingsForms(root);
});

test("loads persisted settings into inputs, including the checkbox and fan speed", async () => {
	vi.mocked(settingsDb.getStartingCupLayerHeight).mockResolvedValue(2);
	vi.mocked(settingsDb.getLineWidthAdjustment).mockResolvedValue(1.2);
	vi.mocked(settingsDb.getCircularSegments).mockResolvedValue(128);
	vi.mocked(settingsDb.getTestCylinderHeight).mockResolvedValue(50);
	vi.mocked(settingsDb.getTestCylinderInnerDiameter).mockResolvedValue(70);
	vi.mocked(settingsDb.getSecondsPerLayer).mockResolvedValue(12);
	vi.mocked(settingsDb.getEPerRevolution).mockResolvedValue(31.3);
	vi.mocked(settingsDb.getUseSecondsPerLayer).mockResolvedValue(true);
	vi.mocked(settingsDb.getConstantSpeed).mockResolvedValue(1200);
	vi.mocked(settingsDb.getFanSpeed).mockResolvedValue(65);

	await forms.loadDataIntoForm();

	expect(root.querySelector<HTMLInputElement>("#fanSpeed").value).toBe("65");
	expect(
		root.querySelector<HTMLInputElement>("#circularResolution").value,
	).toBe("128");
	expect(forms.useSecondsPerLayer.checked).toBe(true);
});

test("form events save fan speed and checkbox changes", async () => {
	root.querySelector<HTMLInputElement>("#fanSpeed").value = "75";
	forms.form.dispatchEvent(new Event("submit", { cancelable: true }));
	await vi.waitFor(() =>
		expect(settingsDb.setFanSpeed).toHaveBeenCalledWith(75),
	);

	forms.useSecondsPerLayer.checked = true;
	forms.useSecondsPerLayer.dispatchEvent(new Event("change"));
	expect(settingsDb.setUseSecondsPerLayer).toHaveBeenCalledWith(true);
});

test("test cylinder submission saves dimensions and prevents closing the dialog", async () => {
	root.querySelector<HTMLInputElement>("#testCylinderHeight").value = "60";
	root.querySelector<HTMLInputElement>("#testCylinderInnerDiameter").value =
		"72";
	const event = new Event("submit", { cancelable: true });
	forms.testCylinderForm.dispatchEvent(event);

	expect(event.defaultPrevented).toBe(true);
	await vi.waitFor(() => {
		expect(settingsDb.setTestCylinderHeight).toHaveBeenCalledWith(60);
		expect(settingsDb.setTestCylinderInnerDiameter).toHaveBeenCalledWith(72);
	});
});

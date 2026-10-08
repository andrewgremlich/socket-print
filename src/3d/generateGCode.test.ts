import { Vector3 } from "three";
import { beforeEach, expect, test, vi } from "vitest";
import {
	getCupHeaterHoldTime,
	getCupHeaterTemperatureTolerance,
	getCupTransitionSpeed,
} from "@/db/appSettingsDbActions";
import { generateGCode } from "./generateGCode";

vi.mock("@/db/appSettingsDbActions", () => ({
	getCircularSegments: vi.fn().mockResolvedValue(8),
	getEPerRevolution: vi.fn().mockResolvedValue(31.3),
	getFanSpeed: vi.fn().mockResolvedValue(50),
	getLineWidthAdjustment: vi.fn().mockResolvedValue(1.2),
	getSecondsPerLayer: vi.fn().mockResolvedValue(12),
	getStartingCupLayerHeight: vi.fn().mockResolvedValue(2),
	getTestCylinderInnerDiameter: vi.fn().mockResolvedValue(70),
	getCupTransitionSpeed: vi.fn(),
	getCupHeaterHoldTime: vi.fn(),
	getCupHeaterTemperatureTolerance: vi.fn(),
}));

vi.mock("@/db/formValuesDbActions", () => ({
	getCupSize: vi.fn().mockResolvedValue({ name: "84x38" }),
	getCupSizeHeight: vi.fn().mockResolvedValue(38),
	getLayerHeight: vi.fn().mockResolvedValue(1),
	getLockPosition: vi.fn().mockResolvedValue("right"),
	getNozzleSize: vi.fn().mockResolvedValue(5),
}));

vi.mock("@/db/materialProfilesDbActions", () => ({
	getActiveMaterialProfileCupTemp: vi.fn().mockResolvedValue(160),
	getActiveMaterialProfileDensity: vi.fn().mockResolvedValue(0.0009),
	getActiveMaterialProfileGramsPerRevolution: vi.fn().mockResolvedValue(0.2),
	getActiveMaterialProfileName: vi.fn().mockResolvedValue("cp1"),
	getActiveMaterialProfileNozzleTemp: vi.fn().mockResolvedValue(200),
	getActiveMaterialProfileOutputFactor: vi.fn().mockResolvedValue(1),
	getActiveMaterialProfileShrinkFactor: vi.fn().mockResolvedValue(2.6),
}));

beforeEach(() => {
	vi.mocked(getCupTransitionSpeed).mockResolvedValue(2000);
	vi.mocked(getCupHeaterHoldTime).mockResolvedValue(0);
	vi.mocked(getCupHeaterTemperatureTolerance).mockResolvedValue(0);
});

test("uses the configured transition speed without changing model layer speed", async () => {
	vi.mocked(getCupTransitionSpeed).mockResolvedValue(1000);
	const gcode = await generateGCode([[new Vector3(40, 45, 0)]], [1200]);
	const transition = gcode
		.split(";START TRANSITION LAYER\n")[1]
		.split(";END TRANSITION LAYER")[0];
	const moves = transition.trim().split("\n");
	expect(moves.length).toBeGreaterThan(0);
	expect(moves.every((move) => move.endsWith("F1000"))).toBe(true);
	expect(gcode.split(";START NEW LEVEL 1")[1]).toMatch(/G1 .* E[\d.]+ F1200/);
});

test("waits with zero cup temperature tolerance and holds before shutdown and pickup", async () => {
	vi.mocked(getCupHeaterHoldTime).mockResolvedValue(30);
	const gcode = await generateGCode([], []);
	const wait = gcode.indexOf("M116 H2 S0");
	const hold = gcode.indexOf("G4 S30");
	const shutdown = gcode.indexOf("M140 P1 S0");
	const pickup = gcode.indexOf("G1 Z70 F6000");
	expect(wait).toBeGreaterThan(-1);
	expect(hold).toBeGreaterThan(wait);
	expect(shutdown).toBeGreaterThan(hold);
	expect(pickup).toBeGreaterThan(shutdown);
	expect(gcode).toContain("M116 P0 S2");
	expect(gcode).not.toContain("M116 H2 S2");
});

test("zero hold time adds no cup heater dwell", async () => {
	const gcode = await generateGCode([], []);
	expect(gcode).not.toContain("hold cup heater");
	expect(gcode).not.toContain("G4 S0");
});

test("uses the configured cup heater temperature tolerance", async () => {
	vi.mocked(getCupHeaterTemperatureTolerance).mockResolvedValue(2.5);
	const gcode = await generateGCode([], []);
	expect(gcode).toContain("M116 H2 S2.5 ; wait for cup temperature +/-2.5C");
	expect(gcode).toContain("M116 P0 S2");
});

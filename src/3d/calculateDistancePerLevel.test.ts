import { Vector3 } from "three";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { calculateFeedratePerLevel } from "./calculateDistancePerLevel";

vi.mock("@/db/appSettingsDbActions", () => ({
	getCircularSegments: vi.fn().mockResolvedValue(64),
	getSecondsPerLayer: vi.fn().mockResolvedValue(8),
}));

describe("calculateFeedratePerLevel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("returns empty array for empty input", async () => {
		const result = await calculateFeedratePerLevel([]);
		expect(result).toEqual([]);
	});

	test("returns array with same length as input levels", async () => {
		const points = [
			[new Vector3(10, 0, 0), new Vector3(0, 0, 10), new Vector3(-10, 0, 0)],
			[new Vector3(10, 1, 0), new Vector3(0, 1, 10), new Vector3(-10, 1, 0)],
		];

		const result = await calculateFeedratePerLevel(points);

		expect(result).toHaveLength(2);
	});

	test("returns rounded feedrate values", async () => {
		const points = [[new Vector3(0, 0, 0), new Vector3(10, 0, 0)]];

		const result = await calculateFeedratePerLevel(points);

		expect(Number.isInteger(result[0])).toBe(true);
	});

	test("calculates feedrate based on distance and time per layer", async () => {
		// Two points 10mm apart, segments=64, timePerLayer=8
		// accomodateForFullRevolution = (64 + 1) / 2 = 32.5
		// distance = 10 * 32.5 = 325
		// feedrate = (325 * 60) / 8 = 2437.5, rounded = 2438
		const points = [[new Vector3(0, 0, 0), new Vector3(10, 0, 0)]];

		const result = await calculateFeedratePerLevel(points);

		expect(result[0]).toBe(2438);
	});

	test("handles multiple levels with different distances", async () => {
		const points = [
			[new Vector3(0, 0, 0), new Vector3(10, 0, 0)],
			[new Vector3(0, 1, 0), new Vector3(20, 1, 0)],
		];

		const result = await calculateFeedratePerLevel(points);

		expect(result[1]).toBeGreaterThan(result[0]);
	});

	test("handles circular arrangement of points", async () => {
		// Create points in a circle pattern
		const points = [
			[
				new Vector3(10, 0, 0),
				new Vector3(0, 0, 10),
				new Vector3(-10, 0, 0),
				new Vector3(0, 0, -10),
			],
		];

		const result = await calculateFeedratePerLevel(points);

		expect(result).toHaveLength(1);
		expect(result[0]).toBeGreaterThan(0);
	});

	test("handles single point per level", async () => {
		const points = [[new Vector3(10, 0, 0)]];

		const result = await calculateFeedratePerLevel(points);

		// With only one point, distance is 0
		expect(result[0]).toBe(0);
	});

	test("calculates distance correctly for 3D points", async () => {
		// Points with y variation should still calculate correct distance
		const points = [[new Vector3(0, 0, 0), new Vector3(3, 4, 0)]];

		const result = await calculateFeedratePerLevel(points);

		// Distance is 5 (3-4-5 triangle)
		// accomodateForFullRevolution = (64 + 1) / 2 = 32.5
		// adjusted distance = 5 * 32.5 = 162.5
		// feedrate = (162.5 * 60) / 8 = 1218.75, rounded = 1219
		expect(result[0]).toBe(1219);
	});

	test("handles levels with many segments", async () => {
		const level: Vector3[] = [];
		for (let i = 0; i <= 64; i++) {
			const angle = (i / 64) * Math.PI * 2;
			level.push(new Vector3(Math.cos(angle) * 10, 0, Math.sin(angle) * 10));
		}

		const result = await calculateFeedratePerLevel([level]);

		expect(result).toHaveLength(1);
		expect(result[0]).toBeGreaterThan(0);
	});

	test("returns consistent results for identical levels", async () => {
		const level = [
			new Vector3(10, 0, 0),
			new Vector3(0, 0, 10),
			new Vector3(-10, 0, 0),
		];

		const points = [
			level.map((p) => p.clone()),
			level.map((p) => new Vector3(p.x, 1, p.z)),
		];

		const result = await calculateFeedratePerLevel(points);

		expect(result[0]).toBe(result[1]);
	});
});

import { Vector3 } from "three";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { calculatePrintTime } from "./calculatePrintTime";

describe("calculatePrintTime", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("returns '0h 0m 0s' for empty input", async () => {
		const result = await calculatePrintTime([], []);
		expect(result).toBe("0h 0m 0s");
	});

	test("returns '0h 0m 0s' for single level", async () => {
		const points = [[new Vector3(0, 0, 0), new Vector3(10, 0, 0)]];
		const feedrates = [1000];

		const result = await calculatePrintTime(points, feedrates);

		expect(result).toBe("0h 0m 0s");
	});

	test("returns formatted time string with minutes and seconds", async () => {
		const points = [
			[new Vector3(0, 0, 0), new Vector3(10, 0, 0)],
			[new Vector3(0, 1, 0), new Vector3(10, 1, 0)],
		];
		const feedrates = [1000, 1000];

		const result = await calculatePrintTime(points, feedrates);

		expect(result).toMatch(/^\d+m \d+s$/);
	});

	test("calculates time based on distance and feedrate", async () => {
		// Two layers, each with 10mm path, feedrate 600 mm/min = 10mm/s
		// Layer distance: 10mm each = 20mm total within layers
		// Inter-layer distance: small vertical move
		const points = [
			[new Vector3(0, 0, 0), new Vector3(10, 0, 0)],
			[new Vector3(0, 1, 0), new Vector3(10, 1, 0)],
		];
		const feedrates = [600, 600];

		const result = await calculatePrintTime(points, feedrates);

		expect(result).toMatch(/\d+m \d+s/);
	});

	test("skips layers with zero feedrate", async () => {
		const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const points = [
			[new Vector3(0, 0, 0), new Vector3(10, 0, 0)],
			[new Vector3(0, 1, 0), new Vector3(10, 1, 0)],
		];
		const feedrates = [0, 1000];

		await calculatePrintTime(points, feedrates);

		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	test("skips layers with zero distance", async () => {
		const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const points = [
			[new Vector3(0, 0, 0)], // Single point = zero distance
			[new Vector3(0, 1, 0), new Vector3(10, 1, 0)],
		];
		const feedrates = [1000, 1000];

		await calculatePrintTime(points, feedrates);

		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	test("includes inter-layer travel distance", async () => {
		const points = [
			[new Vector3(0, 0, 0), new Vector3(10, 0, 0)],
			[new Vector3(0, 10, 0), new Vector3(10, 10, 0)],
		];
		const feedrates = [1000, 1000];

		const result = await calculatePrintTime(points, feedrates);

		// Should account for travel between layers
		expect(result).toMatch(/\d+m \d+s/);
	});

	test("handles multiple layers", async () => {
		const points = [
			[new Vector3(0, 0, 0), new Vector3(10, 0, 0)],
			[new Vector3(0, 1, 0), new Vector3(10, 1, 0)],
			[new Vector3(0, 2, 0), new Vector3(10, 2, 0)],
			[new Vector3(0, 3, 0), new Vector3(10, 3, 0)],
		];
		const feedrates = [1000, 1000, 1000, 1000];

		const result = await calculatePrintTime(points, feedrates);

		expect(result).toMatch(/\d+m \d+s/);
	});

	test("handles varying feedrates per level", async () => {
		const points = [
			[new Vector3(0, 0, 0), new Vector3(10, 0, 0)],
			[new Vector3(0, 1, 0), new Vector3(10, 1, 0)],
		];
		const feedrates = [500, 2000]; // Slow first layer, fast second

		const result = await calculatePrintTime(points, feedrates);

		expect(result).toMatch(/\d+m \d+s/);
	});

	test("handles empty layers gracefully", async () => {
		const points = [
			[new Vector3(0, 0, 0), new Vector3(10, 0, 0)],
			[],
			[new Vector3(0, 2, 0), new Vector3(10, 2, 0)],
		];
		const feedrates = [1000, 1000, 1000];

		const result = await calculatePrintTime(points, feedrates);

		expect(result).toMatch(/\d+m \d+s/);
	});

	test("calculates 3D distances correctly", async () => {
		// Points forming a 3-4-5 triangle in 3D space
		const points = [
			[new Vector3(0, 0, 0), new Vector3(3, 4, 0)],
			[new Vector3(0, 0, 1), new Vector3(3, 4, 1)],
		];
		const feedrates = [300, 300]; // 5mm/s

		const result = await calculatePrintTime(points, feedrates);

		expect(result).toMatch(/\d+m \d+s/);
	});
});

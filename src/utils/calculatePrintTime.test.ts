import { describe, expect, test } from "vitest";
import type { RawPoint } from "./blendMerge";
import { calculatePrintTime } from "./calculatePrintTime";

describe("calculatePrintTime", () => {
	test("returns '0h 0m 0s' when there are no points", () => {
		const levelsOfPoints: RawPoint[][] = [];
		const result = calculatePrintTime(levelsOfPoints);
		expect(result).toBe("0h 0m 0s");
	});

	test("returns '0h 0m 0s' when there is only one level of points", () => {
		const levelsOfPoints = [[{ x: 0, y: 0, z: 0 }]];
		const result = calculatePrintTime(levelsOfPoints);
		expect(result).toBe("0h 0m 0s");
	});

	test("calculates print time correctly for multiple levels of points", () => {
		const levelsOfPoints = [
			[
				{ x: 0, y: 0, z: 0 },
				{ x: 1, y: 1, z: 1 },
			],
			[
				{ x: 2, y: 2, z: 2 },
				{ x: 3, y: 3, z: 3 },
			],
		];
		const result = calculatePrintTime(levelsOfPoints);
		expect(result).toBe("0h 1m");
	});

	test("calculates print time correctly for another set of points", () => {
		const levelsOfPoints = [[{ x: 0, y: 0, z: 0 }], [{ x: 3, y: 4, z: 0 }]];
		const result = calculatePrintTime(levelsOfPoints);
		expect(result).toBe("0h 1m");
	});

	test("calculates print time correctly for larger distances", () => {
		const levelsOfPoints = [[{ x: 0, y: 0, z: 0 }], [{ x: 60, y: 80, z: 0 }]];
		const result = calculatePrintTime(levelsOfPoints);
		expect(result).toBe("0h 5m");
	});

	test("calculates print time correctly for non-zero z values", () => {
		const levelsOfPoints = [[{ x: 0, y: 0, z: 0 }], [{ x: 3, y: 4, z: 5 }]];
		const result = calculatePrintTime(levelsOfPoints);
		expect(result).toBe("0h 1m");
	});
});

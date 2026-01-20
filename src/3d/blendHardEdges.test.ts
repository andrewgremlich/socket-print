import { Vector3 } from "three";
import { describe, expect, test } from "vitest";
import { blendHardEdges } from "./blendHardEdges";

describe("blendHardEdges", () => {
	test("returns empty array when given empty input", () => {
		const result = blendHardEdges([]);
		expect(result).toEqual([]);
	});

	test("returns cloned points without modifying original", () => {
		const original = [
			[new Vector3(10, 0, 0), new Vector3(0, 0, 10)],
			[new Vector3(10, 1, 0), new Vector3(0, 1, 10)],
		];
		const originalX = original[0][0].x;

		const result = blendHardEdges(original);

		expect(original[0][0].x).toBe(originalX);
		expect(result).not.toBe(original);
		expect(result[0]).not.toBe(original[0]);
		expect(result[0][0]).not.toBe(original[0][0]);
	});

	test("returns same structure for single level", () => {
		const points = [[new Vector3(5, 0, 0), new Vector3(0, 0, 5)]];

		const result = blendHardEdges(points);

		expect(result).toHaveLength(1);
		expect(result[0]).toHaveLength(2);
	});

	test("does not modify points when within overlap tolerance", () => {
		const points = [
			[new Vector3(10, 0, 0), new Vector3(0, 0, 10)],
			[new Vector3(10.3, 1, 0), new Vector3(0, 1, 10.3)],
		];

		const result = blendHardEdges(points, 0.5);

		expect(result[0][0].x).toBeCloseTo(10, 5);
		expect(result[0][1].z).toBeCloseTo(10, 5);
	});

	test("adjusts lower level points when upper level exceeds tolerance", () => {
		// Need at least 3 levels since algorithm starts from floor((length-1) * 0.5)
		const points = [
			[new Vector3(10, 0, 0)],
			[new Vector3(15, 1, 0)],
			[new Vector3(20, 2, 0)],
		];

		const result = blendHardEdges(points, 0.5);

		// Level 0 should be adjusted when level 1 exceeds tolerance (15 - 10 = 5 > 0.5)
		// The algorithm moves the lower point toward the higher point
		const adjustedDistance = result[0][0].distanceTo(
			new Vector3(0, result[0][0].y, 0),
		);
		expect(adjustedDistance).toBeGreaterThan(10);
	});

	test("preserves y coordinate of lower level when blending", () => {
		const points = [[new Vector3(10, 0, 0)], [new Vector3(15, 5, 0)]];

		const result = blendHardEdges(points, 0.5);

		expect(result[0][0].y).toBe(0);
		expect(result[1][0].y).toBe(5);
	});

	test("handles multiple levels correctly", () => {
		const points = [
			[new Vector3(10, 0, 0)],
			[new Vector3(11, 1, 0)],
			[new Vector3(12, 2, 0)],
			[new Vector3(13, 3, 0)],
		];

		const result = blendHardEdges(points, 0.5);

		expect(result).toHaveLength(4);
	});

	test("processes from middle of array downward", () => {
		const points = [
			[new Vector3(10, 0, 0)],
			[new Vector3(15, 1, 0)],
			[new Vector3(16, 2, 0)],
			[new Vector3(17, 3, 0)],
		];

		const result = blendHardEdges(points, 0.5);

		expect(result[3][0].x).toBe(17);
		expect(result[2][0].x).toBe(16);
	});

	test("handles points with z coordinates", () => {
		const points = [[new Vector3(10, 0, 10)], [new Vector3(15, 1, 15)]];

		const result = blendHardEdges(points, 0.5);

		expect(result).toHaveLength(2);
		expect(result[0][0]).toBeInstanceOf(Vector3);
	});

	test("uses default overlap tolerance of 0.5", () => {
		const points = [[new Vector3(10, 0, 0)], [new Vector3(10.3, 1, 0)]];

		const result = blendHardEdges(points);

		expect(result[0][0].x).toBeCloseTo(10, 5);
	});

	test("handles mismatched level lengths gracefully", () => {
		const points = [
			[new Vector3(10, 0, 0), new Vector3(0, 0, 10)],
			[new Vector3(15, 1, 0)],
		];

		const result = blendHardEdges(points, 0.5);

		expect(result).toHaveLength(2);
		expect(result[0]).toHaveLength(2);
		expect(result[1]).toHaveLength(1);
	});

	test("handles coincident points (zero distance)", () => {
		const points = [[new Vector3(10, 0, 0)], [new Vector3(10, 1, 0)]];

		const result = blendHardEdges(points, 0.5);

		expect(result[0][0].x).toBeCloseTo(10, 5);
	});
});

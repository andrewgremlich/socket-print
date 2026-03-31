import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import {
	findPunchLinePoints,
	interpolateHeightAtAngle,
	isPointAboveTrimLine,
} from "./trimLine";

describe("trimLine", () => {
	describe("isPointAboveTrimLine", () => {
		it("returns false when trim line has less than 2 points", () => {
			const point = new Vector3(0, 50, 0);
			const trimLinePoints: Vector3[] = [];

			expect(isPointAboveTrimLine(point, trimLinePoints)).toBe(false);

			trimLinePoints.push(new Vector3(10, 100, 0));
			expect(isPointAboveTrimLine(point, trimLinePoints)).toBe(false);
		});

		it("returns true when point Y is above trim line height", () => {
			const trimLinePoints = [new Vector3(10, 50, 0), new Vector3(-10, 50, 0)];
			const pointAbove = new Vector3(0, 60, 0);
			const pointBelow = new Vector3(0, 40, 0);
			const pointAt = new Vector3(0, 50, 0);

			expect(isPointAboveTrimLine(pointAbove, trimLinePoints)).toBe(true);
			expect(isPointAboveTrimLine(pointBelow, trimLinePoints)).toBe(false);
			expect(isPointAboveTrimLine(pointAt, trimLinePoints)).toBe(false);
		});

		it("handles trim line with varying heights", () => {
			const trimLinePoints = [
				new Vector3(10, 30, 0),
				new Vector3(0, 50, 10),
				new Vector3(-10, 70, 0),
				new Vector3(0, 50, -10),
			];

			const pointAtAngle0Above = new Vector3(5, 40, 0);
			const pointAtAngle0Below = new Vector3(5, 20, 0);

			expect(isPointAboveTrimLine(pointAtAngle0Above, trimLinePoints)).toBe(
				true,
			);
			expect(isPointAboveTrimLine(pointAtAngle0Below, trimLinePoints)).toBe(
				false,
			);
		});
	});

	describe("findPunchLinePoints", () => {
		it("returns empty set when trim line has less than 2 points", () => {
			const pointGatherer = [[new Vector3(0, 0, 0)]];
			expect(findPunchLinePoints(pointGatherer, []).size).toBe(0);
			expect(
				findPunchLinePoints(pointGatherer, [new Vector3(0, 0, 0)]).size,
			).toBe(0);
		});

		it("finds the closest sliced point for each trim line point", () => {
			const pointGatherer = [
				[new Vector3(10, 0, 0), new Vector3(0, 10, 0), new Vector3(-10, 0, 0)],
				[new Vector3(10, 5, 0), new Vector3(0, 15, 0), new Vector3(-10, 5, 0)],
			];
			const trimLinePoints = [
				new Vector3(10, 1, 0), // closest to layer 0, point 0 (distance 1)
				new Vector3(-10, 4, 0), // closest to layer 1, point 2 (distance 1)
			];

			const result = findPunchLinePoints(pointGatherer, trimLinePoints);

			expect(result.has("0,0")).toBe(true);
			expect(result.has("1,2")).toBe(true);
			expect(result.size).toBe(2);
		});

		it("multiple trim points can map to the same sliced point", () => {
			const pointGatherer = [[new Vector3(0, 0, 0), new Vector3(10, 0, 0)]];
			const trimLinePoints = [new Vector3(0, 0.1, 0), new Vector3(0, 0.2, 0)];

			const result = findPunchLinePoints(pointGatherer, trimLinePoints);

			// Both trim points are closest to the same sliced point
			expect(result.has("0,0")).toBe(true);
			expect(result.size).toBe(1);
		});
	});

	describe("interpolateHeightAtAngle", () => {
		it("returns infinity for empty trim line", () => {
			expect(interpolateHeightAtAngle(0, [])).toBe(Number.POSITIVE_INFINITY);
		});

		it("returns single point height for one point", () => {
			const singlePoint = [new Vector3(0, 100, 0)];
			expect(interpolateHeightAtAngle(0, singlePoint)).toBe(100);
			expect(interpolateHeightAtAngle(Math.PI, singlePoint)).toBe(100);
		});

		it("interpolates between two points", () => {
			const twoPoints = [new Vector3(10, 50, 0), new Vector3(-10, 100, 0)];

			const heightAt0 = interpolateHeightAtAngle(0, twoPoints);
			expect(heightAt0).toBeCloseTo(50, 0);

			const heightAtPI = interpolateHeightAtAngle(Math.PI, twoPoints);
			expect(heightAtPI).toBeCloseTo(100, 0);
		});

		it("handles angles outside -PI to PI range", () => {
			const points = [new Vector3(10, 50, 0), new Vector3(-10, 100, 0)];

			const heightAt3PI = interpolateHeightAtAngle(3 * Math.PI, points);
			const heightAtPI = interpolateHeightAtAngle(Math.PI, points);
			expect(heightAt3PI).toBeCloseTo(heightAtPI, 1);
		});
	});
});

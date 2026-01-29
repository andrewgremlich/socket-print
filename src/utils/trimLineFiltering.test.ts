import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import {
	interpolateHeightAtAngle,
	isPointAboveTrimLine,
} from "./trimLineFiltering";

describe("trimLineFiltering", () => {
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
			// Trim line with different heights at different angles
			const trimLinePoints = [
				new Vector3(10, 30, 0), // angle ~0
				new Vector3(0, 50, 10), // angle ~PI/2
				new Vector3(-10, 70, 0), // angle ~PI
				new Vector3(0, 50, -10), // angle ~-PI/2
			];

			// Point at angle ~0 (should compare against height 30)
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
			const twoPoints = [
				new Vector3(10, 50, 0), // angle ~0
				new Vector3(-10, 100, 0), // angle ~PI
			];

			// At angle 0, should be close to 50
			const heightAt0 = interpolateHeightAtAngle(0, twoPoints);
			expect(heightAt0).toBeCloseTo(50, 0);

			// At angle PI, should be close to 100
			const heightAtPI = interpolateHeightAtAngle(Math.PI, twoPoints);
			expect(heightAtPI).toBeCloseTo(100, 0);
		});

		it("handles angles outside -PI to PI range", () => {
			const points = [new Vector3(10, 50, 0), new Vector3(-10, 100, 0)];

			// Angle greater than PI should be normalized
			const heightAt3PI = interpolateHeightAtAngle(3 * Math.PI, points);
			const heightAtPI = interpolateHeightAtAngle(Math.PI, points);
			expect(heightAt3PI).toBeCloseTo(heightAtPI, 1);
		});
	});
});

import { describe, expect, test } from "vitest";
import {
	type ExtrusionParams,
	getExtrusionCalculation,
} from "./getExtrusionCalculation";

describe("getExtrusionCalculation", () => {
	const baseParams: ExtrusionParams = {
		distance: 10,
		layerHeight: 0.2,
		lineWidth: 0.4,
		gramsPerRevolution: 0.05,
		density: 1.24,
		ePerRevolution: 1,
		outputFactor: 1,
	};

	test("calculates extrusion for given parameters", () => {
		const result = getExtrusionCalculation(baseParams);

		// Manual calculation: (10 * 0.2 * 0.4) / (0.05 / 1.24 / 1) * 1
		// = 0.8 / 0.0403226... = 19.84
		expect(result).toBeCloseTo(19.84, 2);
	});

	test("extrusion scales linearly with distance", () => {
		const result1 = getExtrusionCalculation({ ...baseParams, distance: 10 });
		const result2 = getExtrusionCalculation({ ...baseParams, distance: 20 });

		expect(result2).toBeCloseTo(result1 * 2, 10);
	});

	test("extrusion scales linearly with layerHeight", () => {
		const result1 = getExtrusionCalculation({
			...baseParams,
			layerHeight: 0.2,
		});
		const result2 = getExtrusionCalculation({
			...baseParams,
			layerHeight: 0.4,
		});

		expect(result2).toBeCloseTo(result1 * 2, 10);
	});

	test("extrusion scales linearly with lineWidth", () => {
		const result1 = getExtrusionCalculation({ ...baseParams, lineWidth: 0.4 });
		const result2 = getExtrusionCalculation({ ...baseParams, lineWidth: 0.8 });

		expect(result2).toBeCloseTo(result1 * 2, 10);
	});

	test("extrusion scales linearly with outputFactor", () => {
		const result1 = getExtrusionCalculation({ ...baseParams, outputFactor: 1 });
		const result2 = getExtrusionCalculation({ ...baseParams, outputFactor: 2 });

		expect(result2).toBeCloseTo(result1 * 2, 10);
	});

	test("extrusion scales inversely with gramsPerRevolution", () => {
		const result1 = getExtrusionCalculation({
			...baseParams,
			gramsPerRevolution: 0.05,
		});
		const result2 = getExtrusionCalculation({
			...baseParams,
			gramsPerRevolution: 0.1,
		});

		expect(result2).toBeCloseTo(result1 / 2, 10);
	});

	test("extrusion scales with density", () => {
		const result1 = getExtrusionCalculation({ ...baseParams, density: 1.24 });
		const result2 = getExtrusionCalculation({ ...baseParams, density: 2.48 });

		expect(result2).toBeCloseTo(result1 * 2, 10);
	});

	test("returns zero when distance is zero", () => {
		const result = getExtrusionCalculation({ ...baseParams, distance: 0 });
		expect(result).toBe(0);
	});

	test("returns zero when layerHeight is zero", () => {
		const result = getExtrusionCalculation({ ...baseParams, layerHeight: 0 });
		expect(result).toBe(0);
	});

	test("returns zero when lineWidth is zero", () => {
		const result = getExtrusionCalculation({ ...baseParams, lineWidth: 0 });
		expect(result).toBe(0);
	});
});

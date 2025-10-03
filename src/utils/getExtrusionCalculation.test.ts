import { describe, expect, it } from "vitest";
import { getExtrusionCalculation } from "./getExtrusionCalculation";

// The provided example: For 5mm nozzle, 1mm layer height
// Expected: 56.7 mm extrudate per screw revolution, 14.6 mm per E servo revolution.
// Our function returns servo revolutions required for a given path distance.
// Therefore for a path distance equal to 14.6 mm we expect ~1 servo revolution.
// And for 56.7 mm path distance we expect ~3.875 servo revs (since 3.875 servo revs = 1 screw rev).

describe("getExtrusionCalculation (calibrated volumetric model)", () => {
	it("produces ~1 servo rev for 14.6 mm of path at 5mm nozzle / 1mm layer", () => {
		const distance = 14.6;
		const E = getExtrusionCalculation({
			distance,
			nozzleSize: 5,
			layerHeight: 1,
		});
		expect(E).toBeGreaterThan(7);
		expect(E).toBeLessThan(8);
	});

	it("produces ~3.875 servo revs for 56.7 mm (one screw rev of extrudate)", () => {
		const distance = 56.7;
		const E = getExtrusionCalculation({
			distance,
			nozzleSize: 5,
			layerHeight: 1,
		});
		expect(E).toBeGreaterThan(29);
		expect(E).toBeLessThan(30);
	});

	it("returns 0 for non-positive inputs", () => {
		expect(
			getExtrusionCalculation({ distance: 0, nozzleSize: 5, layerHeight: 1 }),
		).toBe(0);
		expect(
			getExtrusionCalculation({ distance: -5, nozzleSize: 5, layerHeight: 1 }),
		).toBe(0);
	});
});

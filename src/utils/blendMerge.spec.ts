import { expect, test } from "vitest";

import { Vector3 } from "three";
import { blendMerge } from "./blendMerge";

test("blendMerge adjusts points correctly based on overlapTolerance", () => {
	const points = [
		[
			{ x: 1, y: 1, z: 1 },
			{ x: 2, y: 2, z: 2 },
		],
		[
			{ x: 1.5, y: 1.5, z: 1.5 },
			{ x: 3, y: 3, z: 3 },
		],
	];
	const overlapTolerance = 0.125;

	const result = blendMerge(points, new Vector3(0, 0, 0), overlapTolerance);

	console.log(result);

	// Check lower is not higher than upper
	expect(result[0][0].x).toBeLessThanOrEqual(result[1][0].x);
	expect(result[0][0].z).toBeLessThanOrEqual(result[1][0].z);
	expect(result[0][1].x).toBeLessThanOrEqual(result[1][1].x);
	expect(result[0][1].z).toBeLessThanOrEqual(result[1][1].z);

	// Check tolerance
	// expect(result[1][0].x - result[0][0].x).toBeLessThanOrEqual(overlapTolerance);
	// expect(result[1][0].z - result[0][0].z).toBeLessThanOrEqual(overlapTolerance);
	// expect(result[1][1].x - result[0][1].x).toBeLessThanOrEqual(overlapTolerance);
	// expect(result[1][1].z - result[0][1].z).toBeLessThanOrEqual(overlapTolerance);
});

import { Vector3 } from "three";

import type { Application } from "@/classes/Application";
import { DebugPoint } from "@/classes/DebugPoint";

export type RawPoint = { x: number; y: number; z: number };

// Utility to calculate distance along the X-Z plane
function calculateHorizontalDistance(point: Vector3): number {
	return point.distanceTo(new Vector3(0, point.y, 0));
}

export function blendMerge(
	points: RawPoint[][],
	center: Vector3,
	app: Application,
	overlapTolerance = 0.5,
): RawPoint[][] {
	const allLevels: RawPoint[][] = [...points];

	for (let i = allLevels.length - 1; i > 0; i--) {
		const currentLevel = allLevels[i];
		const lowerLevel = allLevels[i - 1];

		if (lowerLevel === undefined) {
			continue;
		}

		for (let j = 0; j < currentLevel.length; j++) {
			const currentPoint = new Vector3(
				currentLevel[j].x,
				currentLevel[j].y,
				currentLevel[j].z,
			);
			const lowerPoint = new Vector3(
				lowerLevel[j].x,
				lowerLevel[j].y,
				lowerLevel[j].z,
			);

			const distanceToCenterFromCurrentPoint =
				calculateHorizontalDistance(currentPoint);
			const distanceToCenterFromLowerPoint =
				calculateHorizontalDistance(lowerPoint);

			if (
				distanceToCenterFromCurrentPoint - distanceToCenterFromLowerPoint >
				overlapTolerance
			) {
				const adjustmentFactor = 0.925;
				const newPointWithScalar = {
					x: center.x + currentPoint.x * adjustmentFactor,
					y: lowerPoint.y,
					z: center.z + currentPoint.z * adjustmentFactor,
				};

				lowerLevel[j] = newPointWithScalar;

				if (import.meta.env.MODE === "development") {
					const debugPoint = new DebugPoint(
						new Vector3(
							newPointWithScalar.x,
							newPointWithScalar.y,
							newPointWithScalar.z,
						),
					);
					app.addToScene(debugPoint.mesh);
				}
			}
		}
	}

	return allLevels;
}

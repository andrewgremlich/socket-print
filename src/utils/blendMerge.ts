import { Vector3 } from "three";

import type { Application } from "@/classes/Application";
import { DebugPoint } from "@/classes/DebugPoint";

export type RawPoint = { x: number; y: number; z: number };

// Utility to calculate distance along the X-Z plane
function calculateHorizontalDistance(point: Vector3): number {
	return point.distanceTo(new Vector3(0, point.y, 0));
}

//TODO: I might need to double check what the direction of the vector is...
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

			const distanceToCenterFromCurrentPoint = calculateHorizontalDistance(
				new Vector3(0, currentPoint.y, 0),
			);
			const distanceToCenterFromLowerPoint = calculateHorizontalDistance(
				new Vector3(0, lowerPoint.y, 0),
			);

			if (
				distanceToCenterFromCurrentPoint - distanceToCenterFromLowerPoint >
				overlapTolerance
			) {
				const adjustmentFactor = 0.925;
				// reference https://chatgpt.com/share/678c4b5b-eacc-800d-91e5-f4236fe08c33
				// parametric equation of a line
				const newPointWithScalar = {
					x: center.x + currentPoint.x * adjustmentFactor, // TODO: Try just currentPoint.x * adjustmentFactor => This should come out lower than the currentPoint
					y: lowerPoint.y,
					z: center.z + currentPoint.z * adjustmentFactor,
				};

				lowerLevel[j] = newPointWithScalar;

				if (import.meta.env.MODE === "development") {
					console.log({
						distanceToCenterFromCurrentPoint,
						distanceToCenterFromLowerPoint,
						lowerPoint,
						newPointWithScalar,
						newLowerPointDistanceFromCenter: new Vector3(
							newPointWithScalar.x,
							newPointWithScalar.y,
							newPointWithScalar.z,
						).distanceTo(new Vector3(0, lowerPoint.y, 0)),
					});

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

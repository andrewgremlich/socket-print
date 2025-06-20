import { floor, sqrt } from "mathjs";
import { Vector3 } from "three";

export type RawPoint = { x: number; y: number; z: number };

// Utility to calculate distance along the X-Z plane
function calculateHorizontalDistance(point: Vector3): number {
	return point.distanceTo(new Vector3(0, point.y, 0));
}

function getPointAtDistance(
	higherPoint: RawPoint,
	lowerPoint: RawPoint,
	distanceToChange: number,
): RawPoint {
	const dx = higherPoint.x - lowerPoint.x;
	const dz = higherPoint.z - lowerPoint.z;
	const distance = sqrt(dx * dx + dz * dz) as number;

	const unitX = dx / distance;
	const unitZ = dz / distance;

	return {
		x: higherPoint.x - distanceToChange * unitX,
		y: lowerPoint.y,
		z: higherPoint.z - distanceToChange * unitZ,
	};
}

export function blendHardEdges(
	points: RawPoint[][],
	overlapTolerance = 0.5,
): RawPoint[][] {
	const allLevels: RawPoint[][] = [...points];

	for (let i = floor((allLevels.length - 1) * 0.5); i > 0; i--) {
		const currentLevel = allLevels[i];
		const lowerLevel = allLevels[i - 1];

		if (lowerLevel === undefined) {
			continue;
		}

		for (let j = 0; j < currentLevel.length; j++) {
			if (lowerLevel[j] === undefined) {
				continue;
			}

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
				const newPoint = getPointAtDistance(
					currentLevel[j],
					lowerLevel[j],
					overlapTolerance / 2,
				);

				lowerLevel[j] = newPoint;
			}
		}
	}

	return allLevels;
}

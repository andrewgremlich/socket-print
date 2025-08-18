import { floor } from "mathjs";
import { Vector3 } from "three";

// Utility to calculate distance along the X-Z plane
function calculateHorizontalDistance(point: Vector3): number {
	return point.distanceTo(new Vector3(0, point.y, 0));
}

function getPointAtDistance(
	higherPoint: Vector3,
	lowerPoint: Vector3,
	distanceToChange: number,
): Vector3 {
	const dx = higherPoint.x - lowerPoint.x;
	const dz = higherPoint.z - lowerPoint.z;
	const distance = Math.sqrt(dx * dx + dz * dz);
	if (distance === 0) return lowerPoint.clone();
	const unitX = dx / distance;
	const unitZ = dz / distance;
	return new Vector3(
		higherPoint.x - distanceToChange * unitX,
		lowerPoint.y,
		higherPoint.z - distanceToChange * unitZ,
	);
}

export function blendHardEdges(
	points: Vector3[][],
	overlapTolerance = 0.5,
): Vector3[][] {
	// Deep clone the input to avoid mutating the original
	const allLevels: Vector3[][] = points.map((level) =>
		level.map((pt) => pt.clone()),
	);

	for (let i = floor((allLevels.length - 1) * 0.5); i > 0; i--) {
		const currentLevel = allLevels[i];
		const lowerLevel = allLevels[i - 1];
		if (!lowerLevel) continue;
		for (let j = 0; j < currentLevel.length; j++) {
			if (!lowerLevel[j]) continue;
			const currentPoint = currentLevel[j];
			const lowerPoint = lowerLevel[j];
			const distanceToCenterFromCurrentPoint =
				calculateHorizontalDistance(currentPoint);
			const distanceToCenterFromLowerPoint =
				calculateHorizontalDistance(lowerPoint);
			if (
				distanceToCenterFromCurrentPoint - distanceToCenterFromLowerPoint >
				overlapTolerance
			) {
				const newPoint = getPointAtDistance(
					currentPoint,
					lowerPoint,
					overlapTolerance / 2,
				);
				lowerLevel[j] = newPoint;
			}
		}
	}
	return allLevels;
}

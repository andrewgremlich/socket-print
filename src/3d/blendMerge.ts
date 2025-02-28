import { Vector3 } from "three";

export type RawPoint = { x: number; y: number; z: number };

// Utility to calculate distance along the X-Z plane
function calculateHorizontalDistance(point: Vector3): number {
	return point.distanceTo(new Vector3(0, point.y, 0));
}

function getPointAtDistance(
	higherPoint: RawPoint,
	lowerPoint: RawPoint,
	d: number,
): RawPoint {
	const pointA = new Vector3(higherPoint.x, 0, higherPoint.z);
	const pointB = new Vector3(lowerPoint.x, 0, lowerPoint.z);

	const direction = new Vector3().subVectors(pointA, pointB);

	direction.normalize();
	direction.multiplyScalar(d);

	console.log({ pointA, pointB, direction });

	const P = new Vector3().addVectors(pointA, direction);

	return { x: P.x, y: lowerPoint.y, z: P.z };
}

export function blendMerge(
	points: RawPoint[][],
	center: Vector3,
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
				Math.abs(
					distanceToCenterFromCurrentPoint - distanceToCenterFromLowerPoint,
				) > overlapTolerance
			) {
				const adjustmentFactor = 0.97;
				const newPointWithScalar = {
					x: center.x + currentPoint.x * adjustmentFactor,
					y: lowerPoint.y,
					z: center.z + currentPoint.z * adjustmentFactor,
				};

				const newEquationForPoint = getPointAtDistance(
					currentLevel[j],
					lowerLevel[j],
					overlapTolerance / 2,
				);

				// console.log({
				// 	newPointWithScalar,
				// 	lowerPoint,
				// 	currentPoint,
				// 	center,
				// });

				lowerLevel[j] = newEquationForPoint;
			}
		}
	}

	return allLevels;
}

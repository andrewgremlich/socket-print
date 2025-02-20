import { Vector3 } from "three";

export type RawPoint = { x: number; y: number; z: number };

function calculateHorizontalDistance(point: Vector3): number {
	return point.distanceTo(new Vector3(0, point.y, 0));
}

export function blendMerge(
	points: RawPoint[],
	center: Vector3,
	overlapTolerance = 0.5,
): RawPoint[] {
	// Clone the points array to avoid mutating the original
	const mergedPoints = [...points];

	for (let i = mergedPoints.length - 1; i > 0; i--) {
		const currentPoint = new Vector3(
			mergedPoints[i].x,
			mergedPoints[i].y,
			mergedPoints[i].z,
		);
		const lowerPoint = new Vector3(
			mergedPoints[i - 1].x,
			mergedPoints[i - 1].y,
			mergedPoints[i - 1].z,
		);

		const distanceToCenterFromCurrent =
			calculateHorizontalDistance(currentPoint);
		const distanceToCenterFromLower = calculateHorizontalDistance(lowerPoint);

		if (
			distanceToCenterFromCurrent - distanceToCenterFromLower >
			overlapTolerance
		) {
			const adjustmentFactor = 0.925;
			mergedPoints[i - 1] = {
				x: center.x + currentPoint.x * adjustmentFactor,
				y: lowerPoint.y,
				z: center.z + currentPoint.z * adjustmentFactor,
			};
		}
	}

	return mergedPoints;
}

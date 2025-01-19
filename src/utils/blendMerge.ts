import { Vector3 } from "three";

export type RawPoint = { x: number; y: number; z: number };

//TODO: I might need to double check what the direction of the vector is...
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

			const distanceToCenterFromCurrentPoint = currentPoint.distanceTo(
				new Vector3(0, currentPoint.y, 0),
			);
			const distanceToCenterFromLowerPoint = lowerPoint.distanceTo(
				new Vector3(0, lowerPoint.y, 0),
			);

			if (
				distanceToCenterFromCurrentPoint - distanceToCenterFromLowerPoint >
				overlapTolerance
			) {
				const adjustmentFactor =
					(distanceToCenterFromLowerPoint - overlapTolerance) /
					distanceToCenterFromCurrentPoint;
				// reference https://chatgpt.com/share/678c4b5b-eacc-800d-91e5-f4236fe08c33
				// parametric equation of a line
				const newPointWithScalar = {
					x: center.x + lowerPoint.x * adjustmentFactor,
					y: lowerPoint.y,
					z: center.z + lowerPoint.z * adjustmentFactor,
				};

				lowerLevel[j] = newPointWithScalar;

				console.log({
					lowerPoint,
					newPointWithScalar,
				});
			}
		}
	}

	return allLevels;
}

import { ceil, floor, sqrt } from "mathjs";
import type { RawPoint } from "./blendMerge";

export function calculatePrintTime(levelsOfPoints: RawPoint[][]): string {
	if (levelsOfPoints.length < 2) {
		return "0h 0m 0s";
	}

	let totalDistance = 0;

	for (let i = 1; i < levelsOfPoints.length; i++) {
		for (let j = 0; j < levelsOfPoints[i].length; j++) {
			const point1 = levelsOfPoints[i - 1][j];
			const point2 = levelsOfPoints[i][j];

			const dx = point2.x - point1.x;
			const dy = point2.y - point1.y;
			const dz = point2.z - point1.z;

			totalDistance += sqrt(dx * dx + dy * dy + dz * dz) as number;
		}
	}

	const averageSpeed = 20;
	const printTime = totalDistance / averageSpeed;
	const roundedPrintTime = ceil(printTime);

	const hours = roundedPrintTime / 60;
	const minutes = roundedPrintTime % 60;
	const estimatedPrintTimeString = `${floor(hours)}h ${floor(minutes)}m`;

	return estimatedPrintTimeString;
}

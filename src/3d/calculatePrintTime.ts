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

			totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
		}
	}

	const averageSpeed = 20;
	const printTime = totalDistance / averageSpeed;
	const roundedPrintTime = Math.ceil(printTime);

	const hours = roundedPrintTime / 60;
	const minutes = roundedPrintTime % 60;
	const estimatedPrintTimeString = `${Math.floor(hours)}h ${Math.floor(
		minutes,
	)}m`;

	return estimatedPrintTimeString;
}

import type { RawPoint } from "./blendMerge";

export function calculatePrintTime(points: RawPoint[]): string {
	if (points.length < 2) {
		return "0h 0m 0s";
	}

	let totalDistance = 0;

	for (let i = 1; i < points.length; i++) {
		const point1 = points[i - 1];
		const point2 = points[i];

		const dx = point2.x - point1.x;
		const dy = point2.y - point1.y;
		const dz = point2.z - point1.z;

		totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	const averageSpeed = 20;
	const printTime = totalDistance / averageSpeed;
	const roundedPrintTime = Math.ceil(printTime);

	const hours = Math.floor(roundedPrintTime / 60);
	const minutes = roundedPrintTime % 60;
	const estimatedPrintTimeString = `${hours}h ${minutes}m`;

	return estimatedPrintTimeString;
}

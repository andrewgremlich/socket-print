import { ceil, floor, sqrt } from "mathjs";

import { getActiveMaterialProfileFeedrate } from "@/db/materialProfiles";

import type { RawPoint } from "./blendHardEdges";

export async function calculatePrintTime(
	levelsOfPoints: RawPoint[][],
): Promise<string> {
	if (levelsOfPoints.length < 2) {
		return "0h 0m 0s";
	}

	let totalDistance = 0;

	for (let i = 1; i < levelsOfPoints.length; i++) {
		for (let j = 0; j < levelsOfPoints[i].length; j++) {
			const point1 = levelsOfPoints[i - 1][j];
			const point2 = levelsOfPoints[i][j];

			if (point1 === undefined || point2 === undefined) {
				continue;
			}

			const dx = point2.x - point1.x;
			const dy = point2.y - point1.y;
			const dz = point2.z - point1.z;

			totalDistance += sqrt(dx * dx + dy * dy + dz * dz) as number;
		}
	}

	const feedrate = await getActiveMaterialProfileFeedrate(); // mm/min
	const printTime = totalDistance / feedrate;
	const roundedPrintTime = ceil(printTime);

	const hours = floor(roundedPrintTime / 60);
	const minutes = floor(roundedPrintTime % 60);
	const seconds = roundedPrintTime % 60;
	const estimatedPrintTimeString = `${hours}h ${minutes}m ${seconds}s`;

	return estimatedPrintTimeString;
}

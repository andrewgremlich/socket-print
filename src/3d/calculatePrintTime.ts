import { ceil, floor, sqrt } from "mathjs";

import type { RawPoint } from "./blendHardEdges";

export async function calculatePrintTime(
	levelsOfPoints: RawPoint[][],
	feedratePerLevel: number[],
): Promise<string> {
	if (levelsOfPoints.length < 2) {
		return "0h 0m 0s";
	}

	let totalDistance = 0;

	// Sum path length within each layer
	for (let i = 0; i < levelsOfPoints.length; i++) {
		const layer = levelsOfPoints[i];
		let layerDistance = 0;

		for (let j = 1; j < layer.length; j++) {
			const p1 = layer[j - 1];
			const p2 = layer[j];
			if (p1 && p2) {
				const dx = p2.x - p1.x;
				const dy = p2.y - p1.y;
				const dz = p2.z - p1.z;
				layerDistance += sqrt(dx * dx + dy * dy + dz * dz) as number;
			}
		}

		totalDistance += layerDistance / feedratePerLevel[i];
	}

	// Add distance from end of one layer to start of next
	for (let i = 1; i < levelsOfPoints.length; i++) {
		const prevLayer = levelsOfPoints[i - 1];
		const currLayer = levelsOfPoints[i];
		let layerDistance = 0;

		if (prevLayer.length > 0 && currLayer.length > 0) {
			const p1 = prevLayer[prevLayer.length - 1];
			const p2 = currLayer[0];
			if (p1 && p2) {
				const dx = p2.x - p1.x;
				const dy = p2.y - p1.y;
				const dz = p2.z - p1.z;
				layerDistance += sqrt(dx * dx + dy * dy + dz * dz) as number;
			}
		}

		totalDistance += layerDistance / feedratePerLevel[i];
	}

	const roundedPrintTime = ceil(totalDistance);
	const minutes = floor(roundedPrintTime % 60);
	const seconds = roundedPrintTime % 60;
	const estimatedPrintTimeString = `${minutes}m ${seconds}s`;

	return estimatedPrintTimeString;
}

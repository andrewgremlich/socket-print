import { ceil, floor } from "mathjs";
import type { Vector3 } from "three";

export async function calculatePrintTime(
	levelsOfPoints: Vector3[][],
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
				layerDistance += p2.distanceTo(p1);
			}
		}

		if (feedratePerLevel[i] === 0) {
			console.warn(
				"Feedrate for layer",
				i,
				"is 0, skipping distance calculation",
			);
			continue;
		}

		if (layerDistance === 0) {
			console.warn("Layer", i, "has no distance, skipping");
			continue;
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
				layerDistance += p2.distanceTo(p1);
			}
		}

		if (feedratePerLevel[i] === 0) {
			console.warn(
				"Feedrate for layer",
				i,
				"is 0, skipping distance calculation",
			);
			continue;
		}

		if (layerDistance === 0) {
			console.warn("Layer", i, "has no distance, skipping");
			continue;
		}

		totalDistance += layerDistance / feedratePerLevel[i];
	}

	const roundedPrintTime = ceil(totalDistance);
	const minutes = floor(roundedPrintTime % 60);
	const seconds = roundedPrintTime % 60;
	const estimatedPrintTimeString = `${minutes}m ${seconds}s`;

	return estimatedPrintTimeString;
}

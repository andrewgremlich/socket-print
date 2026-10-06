import { round } from "mathjs";
import type { Vector3 } from "three";
import {
	getCircularSegments,
	getConstantSpeed,
	getSecondsPerLayer,
	getUseSecondsPerLayer,
} from "@/db/appSettingsDbActions";

const calculateDistancePerLevel = async (
	points: Vector3[][],
): Promise<number[]> => {
	const distances: number[] = [];
	const segments = await getCircularSegments();

	for (const level of points) {
		const accomodateForFullRevolution = (segments + 1) / level.length;
		let distance = 0;

		for (let i = 1; i < level.length; i++) {
			const prevPoint = level[i - 1];
			const point = level[i];
			const segmentDistance = point.distanceTo(prevPoint);
			distance += segmentDistance;
		}

		distances.push(distance * accomodateForFullRevolution);
	}

	return distances;
};

export const calculateFeedratePerLevel = async (points: Vector3[][]) => {
	const distances = await calculateDistancePerLevel(points);
	const timePerLayer = await getSecondsPerLayer();
	const useSecondsPerLayer = await getUseSecondsPerLayer();
	const useConstantSpeed = await getConstantSpeed();

	// distance in mm
	// 8 seconds per layer (make programmable)
	// formula conversion: feedrate = (mm distance / sec per layer) * 60 sec / 1 min
	// gets standard mm/min feedrate

	return useSecondsPerLayer
		? distances.map((distance) => round((distance * 60) / timePerLayer))
		: Array.from({ length: distances.length }, () => useConstantSpeed);
};

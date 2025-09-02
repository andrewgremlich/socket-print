import { round } from "mathjs";
import type { Vector3 } from "three";
import { getCircularSegments } from "@/db/appSettingsDbActions";
import { getActiveMaterialProfileSecondsPerLayer } from "@/db/materialProfilesDbActions";

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
	const feedratePerLevel: number[] = [];
	const timePerLayer = await getActiveMaterialProfileSecondsPerLayer();

	// distance in mm
	// 8 seconds per layer (make programmable)
	// formula conversion: feedrate = (mm distance / sec per layer) * 60 sec / 1 min
	// gets standard mm/min feedrate

	for (const distance of distances) {
		const feedrate = (distance * 60) / timePerLayer;
		feedratePerLevel.push(round(feedrate));
	}

	return feedratePerLevel;
};

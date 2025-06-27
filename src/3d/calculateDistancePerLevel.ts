import { round, sqrt } from "mathjs";
import { getActiveMaterialProfileSecondsPerLayer } from "@/db/materialProfiles";
import type { RawPoint } from "./blendHardEdges";

const calculateDistancePerLevel = (points: RawPoint[][]): number[] => {
	const distances: number[] = [];

	for (const level of points) {
		let distance = 0;

		for (let i = 1; i < level.length; i++) {
			const prevPoint = level[i - 1];
			const point = level[i];
			const dx = point.x - prevPoint.x;
			const dy = point.y - prevPoint.y;
			const dz = point.z - prevPoint.z;

			const segmentDistance = sqrt(dx * dx + dy * dy + dz * dz);

			distance +=
				typeof segmentDistance === "number"
					? segmentDistance
					: segmentDistance.re;
		}

		distances.push(distance);
	}
	return distances;
};

export const calculateFeedratePerLevel = async (points: RawPoint[][]) => {
	const distances = calculateDistancePerLevel(points);
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

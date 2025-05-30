import { atan2, cos, sin, sqrt } from "mathjs";

import { getNozzleSize } from "@/db/keyValueSettings";
import { getActiveMaterialProfile } from "@/db/materialProfiles";

import type { RawPoint } from "./blendHardEdges";

export async function adjustForShrinkAndOffset(
	points: RawPoint[][],
	center: RawPoint,
) {
	const activeMaterialProfile = await getActiveMaterialProfile();
	const nozzleSize = await getNozzleSize();
	const shrinkAllowance = activeMaterialProfile.shrinkFactor; // assumed to be in percentage

	if (nozzleSize === 0 || shrinkAllowance === 0) {
		return points;
	}

	const adjustedPoints: RawPoint[][] = [];

	for (const layer of points) {
		const adjustedLayer: RawPoint[] = [];

		for (const pt of layer) {
			// Shift the point relative to the center
			const dx = pt.x - center.x;
			const dz = pt.z - center.z;

			// Get polar coordinates from the shifted point (projected on X-Y plane)
			const r = sqrt(dx * dx + dz * dz) as number;
			const theta = atan2(dz, dx);

			// Adjust radius: add nozzle size and apply shrink percentage adjustment
			let adjustedR = r + nozzleSize / 2;
			adjustedR = adjustedR * (1 - shrinkAllowance / 100);

			// Create new adjusted point and shift it back to the original coordinate system
			adjustedLayer.push({
				x: center.x + adjustedR * cos(theta),
				y: pt.y,
				z: center.z + adjustedR * sin(theta),
			});
		}
		adjustedPoints.push(adjustedLayer);
	}

	return adjustedPoints;
}

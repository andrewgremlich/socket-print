import { atan2, cos, sin, sqrt } from "mathjs";

import { getNozzleSize } from "@/db/appSettings";
import { getActiveMaterialProfile } from "@/db/materialProfiles";

import type { RawPoint } from "./blendMerge";

export async function adjustForShrinkAndOffset(
	points: RawPoint[],
	center: RawPoint,
) {
	const activeMaterialProfile = await getActiveMaterialProfile();
	const nozzleSize = await getNozzleSize();
	const shrinkAllowance = activeMaterialProfile.shrinkFactor; // assumed to be in percentage

	if (nozzleSize === 0 || shrinkAllowance === 0) {
		return points;
	}

	return points.map((pt) => {
		// Shift the point relative to the center
		const dx = pt.x - center.x;
		const dy = pt.y - center.y;

		// Get polar coordinates from the shifted point (projected on X-Z plane)
		const r = sqrt(dx * dx + dy * dy) as number;
		const theta = atan2(dy, dx);

		// Adjust radius: add nozzle size and apply shrink percentage adjustment
		let adjustedR = r + nozzleSize;
		adjustedR = adjustedR * (1 - shrinkAllowance / 100);

		// Create new adjusted point and shift it back to the original coordinate system
		return {
			x: center.x + adjustedR * cos(theta),
			y: center.y + adjustedR * sin(theta),
			z: pt.z,
		};
	});
}

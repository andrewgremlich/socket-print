import { atan2, cos, sin, sqrt } from "mathjs";

import type { RawPoint } from "./blendMerge";

export function adjustForShrinkAndOffset(
	pointLayers: RawPoint[][],
	center: RawPoint,
): RawPoint[][] {
	const store = window.provelPrintStore;
	const activeProfile = window.materialProfiles[store.activeMaterialProfile];
	const nozzleSize = store.nozzleSize;
	const shrinkAllowance = activeProfile.shrinkFactor; // assumed to be in percentage

	if (nozzleSize === 0 || shrinkAllowance === 0) {
		return pointLayers;
	}

	return pointLayers.map((layer) =>
		layer.map((pt) => {
			// Shift the point relative to the center
			const dx = pt.x - center.x;
			const dz = pt.z - center.z;

			// Get polar coordinates from the shifted point (projected on X-Z plane)
			const r = sqrt(dx * dx + dz * dz) as number;
			const theta = atan2(dz, dx);

			// Adjust radius: add nozzle size and apply shrink percentage adjustment
			let adjustedR = r + nozzleSize;
			adjustedR = adjustedR * (1 - shrinkAllowance / 100);

			// Create new adjusted point and shift it back to the original coordinate system
			return {
				x: center.x + adjustedR * cos(theta),
				y: pt.y,
				z: center.z + adjustedR * sin(theta),
			};
		}),
	);
}

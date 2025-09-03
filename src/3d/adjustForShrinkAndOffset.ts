import { atan2, cos, sin, sqrt } from "mathjs";
import { Vector3 } from "three";

import { getActiveMaterialProfileShrinkFactor } from "@/db/materialProfilesDbActions";

type RawPoint = { x: number; y: number; z: number };

export async function adjustForShrinkAndOffset(
	points: RawPoint[][],
	center: Vector3,
): Promise<Vector3[][]> {
	const shrinkAllowance = await getActiveMaterialProfileShrinkFactor();

	if (shrinkAllowance === 0) {
		return points.map((layer) =>
			layer.map((pt) => new Vector3(pt.x, pt.y, pt.z)),
		);
	}

	const adjustedPoints: Vector3[][] = [];

	for (const layer of points) {
		const adjustedLayer: Vector3[] = [];

		for (const pt of layer) {
			const dx = pt.x - center.x;
			const dz = pt.z - center.z;
			const distance = sqrt(dx * dx + dz * dz) as number;
			const theta = atan2(dz, dx);
			const newRadius = distance * (1 + shrinkAllowance / 100); // this math is probably right.

			// Create new adjusted point and shift it back to the original coordinate system
			adjustedLayer.push(
				new Vector3(
					center.x + newRadius * cos(theta),
					pt.y,
					center.z + newRadius * sin(theta),
				),
			);
		}
		adjustedPoints.push(adjustedLayer);
	}

	return adjustedPoints;
}

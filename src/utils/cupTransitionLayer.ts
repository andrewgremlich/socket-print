import { atan2, cos, round, sin, sqrt } from "mathjs";
import { Vector3 } from "three";

export async function getCirclePoints(
	startingPoint: Vector3,
	options: { segments: number; center: Vector3; layerHeight: number },
): Promise<Vector3[]> {
	const angleStep = (2 * Math.PI) / (options.segments ?? 36);

	const dx = startingPoint.x - options.center.x;
	const dy = startingPoint.y - options.center.y;
	const r = Number(sqrt(dx * dx + dy * dy));
	const theta0 = atan2(dy, dx);
	const points: Vector3[] = [];

	const dz = (options.layerHeight * 2) / (options.segments ?? 36);

	for (let i = 0; i < (options.segments ?? 36); i++) {
		const theta = theta0 + i * angleStep;
		const x = options.center.x + r * cos(theta);
		const y = options.center.y + r * sin(theta);
		const z = startingPoint.z + i * dz;

		points.push(new Vector3(x, y, z));
	}

	return points;
}

/**
 * Generates G-code for a transition layer, including extrusion (E value) for each segment.
 * Assumes a constant line width and layer height for all segments.
 * @param points - Array of Vector3 points (in order)
 * @param options - nozzleSize (mm), layerHeight (mm), outputFactor (percent, e.g. 2.1 for 2.1%)
 */
export function getTransitionLayer(
	points: Vector3[],
	{
		nozzleSize,
		layerHeight,
		outputFactor,
		offsetHeight,
	}: {
		nozzleSize: number;
		layerHeight: number;
		outputFactor: number;
		offsetHeight: number;
	},
): string {
	const transitionLayer: string[] = [];
	let previousPoint: Vector3 | undefined;

	for (let i = 0; i < points.length; i++) {
		const point = points[i];
		let extrusion = 0;

		if (previousPoint) {
			const distance = previousPoint.distanceTo(point);
			const lineWidth = nozzleSize * 1.2;

			extrusion =
				distance *
				layerHeight *
				lineWidth *
				(outputFactor / 100) *
				(point.z < 1 ? 1 : point.z);
		}

		transitionLayer.push(
			`G1 X${-round(point.x, 2)} Y${round(point.z + offsetHeight, 2)} Z${round(point.y, 2)}${i > 0 ? ` E${round(extrusion, 2)}` : ""} F2250`,
		);

		previousPoint = point;
	}

	return transitionLayer.join("\n");
}

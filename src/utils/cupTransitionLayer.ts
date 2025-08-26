import { atan2, cos, round, sin, sqrt } from "mathjs";
import { Vector3 } from "three";
import { calculateFeedratePerLevel } from "@/3d/calculateDistancePerLevel";

const MIN_EXTRUSION_Z_FACTOR = 1;

export async function getCirclePoints(
	startingPoint: Vector3,
	options: { segments: number; center: Vector3; layerHeight: number },
): Promise<Vector3[]> {
	const angleStep = (2 * Math.PI) / options.segments;

	// X and Z are for the horizontal plane in ThreeJS
	const dx = startingPoint.x - options.center.x;
	const dz = startingPoint.z - options.center.z;
	const r = Number(sqrt(dx * dx + dz * dz));
	const theta0 = atan2(dz, dx);
	const points: Vector3[] = [];

	// The Z should rise by exactly one layerHeight from start to end
	const dy = options.layerHeight / (options.segments - 1);

	for (let i = 0; i < options.segments; i++) {
		const theta = theta0 - i * angleStep; // Subtract to rotate CCW
		const x = options.center.x + r * cos(theta);
		const y = options.center.y + r * sin(theta);
		const z = startingPoint.z + i * dy;

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
export async function getTransitionLayer(
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
): Promise<string> {
	const transitionLayer: string[] = [];
	const feedrate = await calculateFeedratePerLevel([points]);

	let previousPoint: Vector3 | undefined;

	for (let i = 0; i < points.length; i++) {
		const point = points[i];
		let extrusion = 0;

		if (previousPoint) {
			const distance = previousPoint.distanceTo(point);
			const lineWidth = nozzleSize * 1.2;

			extrusion =
				((distance * layerHeight * lineWidth) / 7) *
				outputFactor *
				(point.z + layerHeight);
		}

		transitionLayer.push(
			`G1 X${-round(point.x, 2)} Y${round(point.y, 2)} Z${round(point.z + offsetHeight, 2)}${i > 0 ? ` E${round(extrusion, 2)}` : ""} F${feedrate}`,
		);

		previousPoint = point;
	}

	return transitionLayer.join("\n");
}

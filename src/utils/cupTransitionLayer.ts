import { atan2, cos, floor, round, sin, sqrt } from "mathjs";
import { Vector3 } from "three";
import { calculateFeedratePerLevel } from "@/3d/calculateDistancePerLevel";

export const MIN_EXTRUSION_Z_FACTOR = 2;
export const EXTRUSION_ADJUSTMENT = 7.7;
export const LINE_WIDTH_ADJUSTMENT = 1.2;

export async function getCirclePoints(
	startingPoint: Vector3,
	options: { segments: number; center: Vector3; layerHeight: number },
): Promise<{ point: Vector3; calculatedLayerHeight: number }[]> {
	const angleStep = (2 * Math.PI) / options.segments;

	// NOTE: X and Z are for the horizontal plane in ThreeJS
	const dx = startingPoint.x - options.center.x;
	const dz = startingPoint.z - options.center.z;
	const r = Number(sqrt(dx * dx + dz * dz));
	const theta0 = atan2(dz, dx);
	const points: { point: Vector3; calculatedLayerHeight: number }[] = [];
	const endingHeight = options.layerHeight + MIN_EXTRUSION_Z_FACTOR;
	const startingHeight = MIN_EXTRUSION_Z_FACTOR;
	const heightDiff = endingHeight - startingHeight;
	const dy = heightDiff / (options.segments - 1);

	for (let i = 0; i < options.segments; i++) {
		const theta = theta0 - i * angleStep; // Subtract to rotate CCW
		const x = options.center.x + r * cos(theta);
		const y = options.center.y + r * sin(theta);
		const z = startingPoint.z + i * dy;

		points.push({
			point: new Vector3(x, y, z),
			calculatedLayerHeight: startingHeight + dy * i,
		});
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
	points: { point: Vector3; calculatedLayerHeight: number }[],
	{
		nozzleSize,
		outputFactor,
		offsetHeight,
	}: {
		nozzleSize: number;
		outputFactor: number;
		offsetHeight: number;
	},
): Promise<string> {
	const transitionLayer: string[] = [];
	const feedrate = await calculateFeedratePerLevel([
		points.map((p) => p.point),
	]);

	let previousPoint: Vector3 | undefined;

	for (let i = 0; i < points.length; i++) {
		const point = points[i].point;
		const layerHeight = points[i].calculatedLayerHeight;

		if (previousPoint) {
			const distance = previousPoint.distanceTo(point);
			const lineWidth = nozzleSize * LINE_WIDTH_ADJUSTMENT;

			const extrusion =
				((distance * layerHeight * lineWidth) / EXTRUSION_ADJUSTMENT) *
				outputFactor;

			transitionLayer.push(
				`G1 X${-round(point.x, 2)} Y${round(point.y, 2)} Z${floor(point.z + offsetHeight, 2)} E${round(extrusion, 2)} F${feedrate}`,
			);
		}

		previousPoint = point;
	}

	return transitionLayer.join("\n");
}

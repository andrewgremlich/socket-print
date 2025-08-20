import { atan2, cos, round, sin, sqrt } from "mathjs";
import { Vector3 } from "three";
import { getCircularSegments, getLayerHeight } from "@/db/keyValueSettings";

export async function getCirclePoints(
	startingPoint: Vector3,
	center: Vector3,
): Promise<Vector3[]> {
	const layerHeight = await getLayerHeight();

	const segments = await getCircularSegments();
	const angleStep = (2 * Math.PI) / segments;

	const dx = startingPoint.x - center.x;
	const dy = startingPoint.y - center.y;
	const r = Number(sqrt(dx * dx + dy * dy));
	const theta0 = atan2(dy, dx);
	const points: Vector3[] = [];

	const dz = (layerHeight * 2) / segments;

	for (let i = 0; i < segments; i++) {
		const theta = theta0 + i * angleStep;
		const x = center.x + r * cos(theta);
		const y = center.y + r * sin(theta);
		const z = startingPoint.z + i * dz;

		points.push(new Vector3(x, y, z));
	}

	return points;
}

export function getTransitionLayer(points: Vector3[]): string {
	const transitionLayer = points.map((point) => {
		return `G1 X${round(point.x, 2)} Y${round(point.y, 2)} Z${round(point.z, 2)} F1500`;
	});

	return transitionLayer.join("\n");
}

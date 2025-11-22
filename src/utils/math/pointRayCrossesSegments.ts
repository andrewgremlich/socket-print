import type { Line3, Vector3 } from "three";

/** Ray casting algorithm to test if point lies inside polygon defined by line segments. */
export function isPointInsidePolygon(
	point: Vector3,
	segments: Line3[],
): boolean {
	let crossings = 0;
	for (const seg of segments) {
		const { start, end } = seg;
		const minY = Math.min(start.y, end.y);
		const maxY = Math.max(start.y, end.y);
		if (point.y < minY || point.y > maxY) continue;
		// horizontal segments skip to reduce double count
		if (start.y === end.y) continue;
		const xIntersect =
			start.x + ((point.y - start.y) * (end.x - start.x)) / (end.y - start.y);
		if (xIntersect > point.x) crossings++;
	}
	return crossings % 2 === 1; // odd => inside
}

import type { Line3, Vector3 } from "three";

/** Simple 2D segment intersection ignoring z. */
export function lineCrossesLine(a: Line3, b: Line3): boolean {
	return segmentsIntersect(a.start, a.end, b.start, b.end);
}

function segmentsIntersect(p1: Vector3, p2: Vector3, p3: Vector3, p4: Vector3) {
	const d1 = direction(p3, p4, p1);
	const d2 = direction(p3, p4, p2);
	const d3 = direction(p1, p2, p3);
	const d4 = direction(p1, p2, p4);
	const cond1 =
		((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
		((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
	if (cond1) return true;
	// Collinear cases simplified
	if (d1 === 0 && onSegment(p3, p4, p1)) return true;
	if (d2 === 0 && onSegment(p3, p4, p2)) return true;
	if (d3 === 0 && onSegment(p1, p2, p3)) return true;
	if (d4 === 0 && onSegment(p1, p2, p4)) return true;
	return false;
}

function direction(a: Vector3, b: Vector3, c: Vector3) {
	return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
}
function onSegment(a: Vector3, b: Vector3, c: Vector3) {
	return (
		Math.min(a.x, b.x) <= c.x &&
		c.x <= Math.max(a.x, b.x) &&
		Math.min(a.y, b.y) <= c.y &&
		c.y <= Math.max(a.y, b.y)
	);
}

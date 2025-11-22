import type { Vector3 } from "three";

/** Compute a 2D convex hull (x,y) of provided 3D points (ignoring z) using Graham scan. */
export function getConvexHull(points: Vector3[]): Vector3[] {
	if (points.length <= 3) return points.slice();
	// Clone and sort by y then x
	const pts = points.map((p) => p.clone());
	pts.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
	const pivot = pts[0];
	const rest = pts.slice(1).sort((a, b) => angle(pivot, a) - angle(pivot, b));
	const stack: Vector3[] = [pivot, rest[0]];
	for (let i = 1; i < rest.length; i++) {
		const pt = rest[i];
		while (
			stack.length >= 2 &&
			cross(stack[stack.length - 2], stack[stack.length - 1], pt) <= 0
		) {
			stack.pop();
		}
		stack.push(pt);
	}
	return stack;
}

function angle(origin: Vector3, p: Vector3) {
	return Math.atan2(p.y - origin.y, p.x - origin.x);
}
function cross(a: Vector3, b: Vector3, c: Vector3) {
	return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

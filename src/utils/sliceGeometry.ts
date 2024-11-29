import { type BufferGeometry, Vector3 } from "three";

/**
 * Slice a geometry along the Y-axis and return contours at each layer.
 *
 * @param geometry - The geometry to be sliced (BufferGeometry)
 * @param layerWidth - The width between slices
 * @returns An array of slices, where each slice is an array of contours, and each contour is an array of Vector3 points
 */
export function sliceGeometry(
	geometry: BufferGeometry,
	{ minY, maxY }: { minY: number; maxY: number },
): Vector3[][][] {
	const layerWidth = window.provelPrintStore.layerHeight as number;

	if (layerWidth <= 0) {
		throw new Error("Layer width must be greater than 0");
	}

	// Output: Array of layers, each containing arrays of contours
	const slices: Vector3[][][] = [];

	// Get the position attribute (vertex positions)
	const positionAttribute = geometry.attributes.position;

	// Iterate over Y layers from the bottom (minY) to the top (maxY)
	for (let y = minY; y <= maxY; y += layerWidth) {
		const contours: Vector3[][] = []; // Array to hold the contours for this slice

		const v1 = new Vector3();
		const v2 = new Vector3();
		const v3 = new Vector3();

		// Loop through each triangle in the geometry
		for (let i = 0; i < positionAttribute.count; i += 3) {
			// Get the 3 vertices of the triangle
			v1.fromBufferAttribute(positionAttribute, i);
			v2.fromBufferAttribute(positionAttribute, i + 1);
			v3.fromBufferAttribute(positionAttribute, i + 2);

			// Find the intersection of each edge of the triangle with the slice plane at Y = y
			const intersections = [
				intersectEdgeWithY(v1, v2, y),
				intersectEdgeWithY(v2, v3, y),
				intersectEdgeWithY(v3, v1, y),
			].filter(Boolean) as Vector3[][];

			// If exactly two intersections are found, we have a valid contour segment
			if (intersections.length === 2) {
				contours.push([intersections[0][0], intersections[1][0]]); // Push the segment (two points)
			}
		}

		// Push the contours for this slice layer to the output array
		if (contours.length > 0) {
			slices.push(contours);
		}
	}

	return slices;
}

/**
 * Intersect an edge with a horizontal plane at Y = y.
 *
 * @param v1 - The first vertex of the edge
 * @param v2 - The second vertex of the edge
 * @param y - The Y-coordinate of the slicing plane
 * @returns A Vector3 array containing the intersection point, or null if there is no intersection
 */
function intersectEdgeWithY(
	v1: Vector3,
	v2: Vector3,
	y: number,
): Vector3[] | null {
	// Check if the edge crosses the plane at Y = y
	if ((v1.y <= y && v2.y >= y) || (v2.y <= y && v1.y >= y)) {
		// Calculate the interpolation factor 't' to find the intersection point
		const t = (y - v1.y) / (v2.y - v1.y);
		// Return the intersection point
		return [new Vector3(v1.x + t * (v2.x - v1.x), y, v1.z + t * (v2.z - v1.z))];
	}

	// No intersection found
	return null;
}

import { type BufferGeometry, Vector3 } from "three";

/**
 * Slice a geometry along the Z-axis and return contours at each layer.
 *
 * @param geometry - The geometry to be sliced (BufferGeometry)
 * @param layerWidth - The width between slices
 * @returns An array of slices, where each slice is an array of contours, and each contour is an array of Vector3 points
 */
export function sliceGeometry(
	geometry: BufferGeometry,
	{ maxZ }: { maxZ: number },
): Vector3[][][] {
	const layerWidth = window.provelPrintStore.layerHeight as number;

	if (layerWidth <= 0) {
		throw new Error("Layer width must be greater than 0");
	}

	// Output: Array of layers, each containing arrays of contours
	const slices: Vector3[][][] = [];

	// Get the position attribute (vertex positions)
	const positionAttribute = geometry.attributes.position;

	console.log(maxZ, layerWidth);
	console.log(positionAttribute);

	// Iterate over Z layers from the bottom (minZ) to the top (maxZ)
	for (let z = 0; z <= maxZ; z += layerWidth) {
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

			// Find the intersection of each edge of the triangle with the slice plane at Z = z
			const intersections = [
				intersectEdgeWithZ(v1, v2, z),
				intersectEdgeWithZ(v2, v3, z),
				intersectEdgeWithZ(v3, v1, z),
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
 * Intersect an edge with a horizontal plane at Z = z.
 *
 * @param v1 - The first vertex of the edge
 * @param v2 - The second vertex of the edge
 * @param z - The Z-coordinate of the slicing plane
 * @returns A Vector3 array containing the intersection point, or null if there is no intersection
 */
function intersectEdgeWithZ(
	v1: Vector3,
	v2: Vector3,
	z: number,
): Vector3[] | null {
	// Check if the edge crosses the plane at Z = z
	if ((v1.z <= z && v2.z >= z) || (v2.z <= z && v1.z >= z)) {
		// Calculate the interpolation factor 't' to find the intersection point
		const t = (z - v1.z) / (v2.z - v1.z);
		// Return the intersection point
		return [new Vector3(v1.x + t * (v2.x - v1.x), v1.y + t * (v2.y - v1.y), z)];
	}

	// No intersection found
	return null;
}

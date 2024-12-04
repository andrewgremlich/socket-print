import { type BufferGeometry, Vector3 } from "three";

/**
 * Slice a geometry along the Z-axis and return contours at each layer.
 *
 * @param geometry - The geometry to be sliced (BufferGeometry).
 * @param options - Configuration options for slicing.
 * @param options.maxZ - The maximum Z value to slice up to.
 * @param options.layerWidth - The width between slices.
 * @returns An array of slices, where each slice is an array of contours, and each contour is an array of Vector3 points.
 */
export function sliceGeometry(
	geometry: BufferGeometry,
	{ maxZ }: { maxZ: number },
): Vector3[][][] {
	const layerWidth = window.provelPrintStore.layerHeight as number;

	if (layerWidth <= 0) {
		throw new Error("Layer width must be greater than 0");
	}
	if (maxZ <= 0) {
		throw new Error("maxZ must be greater than 0");
	}
	if (!geometry.attributes.position) {
		throw new Error("Geometry must have a 'position' attribute");
	}

	const slices: Vector3[][][] = [];
	const positionAttribute = geometry.attributes.position;

	// Reusable vectors for memory efficiency
	const v1 = new Vector3();
	const v2 = new Vector3();
	const v3 = new Vector3();
	const intersection = new Vector3();

	for (let z = 0; z <= maxZ; z += layerWidth) {
		const contours: Vector3[][] = [];

		for (let i = 0; i < positionAttribute.count; i += 3) {
			v1.fromBufferAttribute(positionAttribute, i);
			v2.fromBufferAttribute(positionAttribute, i + 1);
			v3.fromBufferAttribute(positionAttribute, i + 2);

			const edgeIntersections = [
				intersectEdgeWithZ(v1, v2, z, intersection),
				intersectEdgeWithZ(v2, v3, z, intersection),
				intersectEdgeWithZ(v3, v1, z, intersection),
			].filter(Boolean) as Vector3[];

			if (edgeIntersections.length === 2) {
				contours.push(edgeIntersections); // Valid contour segment
			}
		}

		if (contours.length > 0) {
			slices.push(contours);
		}
	}

	return slices;
}

/**
 * Intersect an edge with a horizontal plane at Z = z.
 *
 * @param v1 - The first vertex of the edge.
 * @param v2 - The second vertex of the edge.
 * @param z - The Z-coordinate of the slicing plane.
 * @param target - A target Vector3 to avoid creating new instances.
 * @returns The intersection point, or null if there is no intersection.
 */
function intersectEdgeWithZ(
	v1: Vector3,
	v2: Vector3,
	z: number,
	target: Vector3,
): Vector3 | null {
	if ((v1.z <= z && v2.z >= z) || (v2.z <= z && v1.z >= z)) {
		const t = (z - v1.z) / (v2.z - v1.z);
		target.set(v1.x + t * (v2.x - v1.x), v1.y + t * (v2.y - v1.y), z);
		return target.clone();
	}
	return null;
}

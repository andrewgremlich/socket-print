import { Box3, type BufferGeometry, Mesh, Vector3 } from "three";

export function sliceGeometry(
	geometry: BufferGeometry,
	layerHeight: number,
): Vector3[][][] {
	const slices: Vector3[][][] = [];

	const bbox = new Box3().setFromObject(new Mesh(geometry));
	const minZ = bbox.min.z;
	const maxZ = bbox.max.z;

	for (let z = minZ; z <= maxZ; z += layerHeight) {
		const slice = getSliceAtZ(geometry, z);
		slices.push(slice);
	}

	return slices;
}

// Get intersections of geometry with the plane at Z = z
function getSliceAtZ(geometry: BufferGeometry, z: number): Vector3[][] {
	const contours: Vector3[][] = [];
	const positionAttribute = geometry.getAttribute("position");
	const vertices = [];

	// Extract vertices
	for (let i = 0; i < positionAttribute.count; i += 3) {
		const v1 = new Vector3().fromBufferAttribute(positionAttribute, i);
		const v2 = new Vector3().fromBufferAttribute(positionAttribute, i + 1);
		const v3 = new Vector3().fromBufferAttribute(positionAttribute, i + 2);

		const intersections = getIntersectionsWithZ(v1, v2, v3, z);

		if (intersections.length === 2) {
			contours.push(intersections);
		}
	}

	return contours;
}

// Check for intersection of triangle edges with a plane at Z and return intersection points
function getIntersectionsWithZ(
	v1: Vector3,
	v2: Vector3,
	v3: Vector3,
	z: number,
): Vector3[] {
	const points: Vector3[] = [];

	if ((v1.z <= z && v2.z >= z) || (v2.z <= z && v1.z >= z)) {
		points.push(interpolate(v1, v2, z));
	}
	if ((v2.z <= z && v3.z >= z) || (v3.z <= z && v2.z >= z)) {
		points.push(interpolate(v2, v3, z));
	}
	if ((v3.z <= z && v1.z >= z) || (v1.z <= z && v3.z >= z)) {
		points.push(interpolate(v3, v1, z));
	}

	return points;
}

// Interpolate between two points to find where the edge intersects the plane
function interpolate(v1: Vector3, v2: Vector3, z: number): Vector3 {
	const t = (z - v1.z) / (v2.z - v1.z);
	return new Vector3(v1.x + t * (v2.x - v1.x), v1.y + t * (v2.y - v1.y), z);
}

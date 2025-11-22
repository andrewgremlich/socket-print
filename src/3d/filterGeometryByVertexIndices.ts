import * as THREE from "three";

/**
 * Given a non-indexed BufferGeometry and a set of vertex indices (triplets per face),
 * produce a new geometry with any triangle containing those vertex indices removed.
 * Assumes geometry is non-indexed (each triangle has unique vertices) as produced by STLLoader.
 */
export function filterGeometryByVertexIndices(
	geometry: THREE.BufferGeometry,
	indicesToRemove: Set<number>,
) {
	const positionAttr = geometry.getAttribute("position");
	const normalAttr = geometry.getAttribute("normal");
	const uvAttr = geometry.getAttribute("uv");

	// Early exit if nothing to remove
	if (indicesToRemove.size === 0) {
		return geometry.clone();
	}

	const positions: number[] = [];
	const normals: number[] = normalAttr ? [] : undefined;
	const uvs: number[] = uvAttr ? [] : undefined;

	// Each triangle = 3 vertices; vertex index corresponds directly to position index.
	for (let i = 0; i < positionAttr.count; i += 3) {
		// Triangle vertex indices are i, i+1, i+2.
		if (
			indicesToRemove.has(i) ||
			indicesToRemove.has(i + 1) ||
			indicesToRemove.has(i + 2)
		) {
			continue; // Skip this triangle entirely
		}

		// Copy positions
		positions.push(
			positionAttr.getX(i),
			positionAttr.getY(i),
			positionAttr.getZ(i),
			positionAttr.getX(i + 1),
			positionAttr.getY(i + 1),
			positionAttr.getZ(i + 1),
			positionAttr.getX(i + 2),
			positionAttr.getY(i + 2),
			positionAttr.getZ(i + 2),
		);

		if (normals && normalAttr) {
			normals.push(
				normalAttr.getX(i),
				normalAttr.getY(i),
				normalAttr.getZ(i),
				normalAttr.getX(i + 1),
				normalAttr.getY(i + 1),
				normalAttr.getZ(i + 1),
				normalAttr.getX(i + 2),
				normalAttr.getY(i + 2),
				normalAttr.getZ(i + 2),
			);
		}

		if (uvs && uvAttr) {
			uvs.push(
				uvAttr.getX(i),
				uvAttr.getY(i),
				uvAttr.getX(i + 1),
				uvAttr.getY(i + 1),
				uvAttr.getX(i + 2),
				uvAttr.getY(i + 2),
			);
		}
	}

	const newGeometry = new THREE.BufferGeometry();
	newGeometry.setAttribute(
		"position",
		new THREE.Float32BufferAttribute(positions, 3),
	);
	if (normals) {
		newGeometry.setAttribute(
			"normal",
			new THREE.Float32BufferAttribute(normals, 3),
		);
	} else {
		newGeometry.computeVertexNormals();
	}
	if (uvs) {
		newGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
	}

	newGeometry.computeBoundingBox();
	newGeometry.computeBoundingSphere();

	return newGeometry;
}

/**
 * Helper to convert a flat list of vertex indices (triplets) into a triangle set.
 * Assumes indices were produced as [a,b,c,a,b,c,...] for each triangle.
 */
export function toTriangleIndexSet(vertexIndices: number[]) {
	const set = new Set<number>();
	for (let i = 0; i < vertexIndices.length; i += 3) {
		// Each face is made of contiguous 3 vertex indices; we mark all three.
		set.add(vertexIndices[i]);
		set.add(vertexIndices[i + 1]);
		set.add(vertexIndices[i + 2]);
	}
	return set;
}

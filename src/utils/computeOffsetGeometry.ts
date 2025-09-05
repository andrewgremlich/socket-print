import type { BufferGeometry } from "three";

export function offsetGeometry(geometry: BufferGeometry, distance: number) {
	// Ensure normals are computed
	geometry.computeVertexNormals();

	const position = geometry.attributes.position;
	const normal = geometry.attributes.normal;

	for (let i = 0; i < position.count; i++) {
		const nx = normal.getX(i);
		const ny = normal.getY(i);
		const nz = normal.getZ(i);

		const px = position.getX(i);
		const py = position.getY(i);
		const pz = position.getZ(i);

		// Move vertex along normal
		position.setXYZ(
			i,
			px + distance * nx,
			py + distance * ny,
			pz + distance * nz,
		);
	}

	geometry.attributes.position.needsUpdate = true;
	geometry.computeVertexNormals(); // refresh normals after moving
	return geometry;
}

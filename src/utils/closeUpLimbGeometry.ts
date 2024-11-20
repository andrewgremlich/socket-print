import { BufferGeometry, Vector3 } from "three";

export function closeUpTopLimbGeometry(
	geometry: BufferGeometry,
): BufferGeometry {
	// Assuming `geometry` is the BufferGeometry of your mesh
	const position = geometry.attributes.position;
	const vertices: Vector3[] = [];
	for (let i = 0; i < position.count; i++) {
		vertices.push(
			new Vector3(position.getX(i), position.getY(i), position.getZ(i)),
		);
	}

	// Step 1: Find the vertices at the max Y value
	const maxY = Math.max(...vertices.map((v) => v.y));
	const topVertices = vertices.filter((v) => v.y === maxY);

	// Step 2: Sort by polar angle around origin
	const center = topVertices
		.reduce((acc, v) => acc.add(v), new Vector3())
		.divideScalar(topVertices.length);
	const sorted = topVertices.sort((a, b) => {
		const angleA = Math.atan2(a.z - center.z, a.x - center.x);
		const angleB = Math.atan2(b.z - center.z, b.x - center.x);
		return angleA - angleB;
	});

	// Step 3: Create triangles
	const newFaces: Vector3[] = [];
	for (let i = 0; i < sorted.length; i++) {
		const a = center;
		const b = sorted[i];
		const c = sorted[(i + 1) % sorted.length]; // Wrap around to the first vertex
		newFaces.push(a.clone(), b.clone(), c.clone());
	}

	// Step 4: Add new triangles to the geometry
	const newGeometry = new BufferGeometry().setFromPoints(newFaces);
	// Optionally merge this newGeometry with the original geometry

	return newGeometry;
}

export function closeUpBottomLimbGeometry(geometry: BufferGeometry) {
	// Assuming `geometry` is the BufferGeometry of your mesh
	const position = geometry.attributes.position;
	const vertices = [];
	for (let i = 0; i < position.count; i++) {
		vertices.push(
			new Vector3(position.getX(i), position.getY(i), position.getZ(i)),
		);
	}

	// Step 1: Find the vertices at the min Y value
	const minY = Math.min(...vertices.map((v) => v.y));
	const bottomVertices = vertices.filter((v) => v.y === minY);

	// Step 2: Sort by polar angle around origin
	const center = bottomVertices
		.reduce((acc, v) => acc.add(v), new Vector3())
		.divideScalar(bottomVertices.length);
	const sorted = bottomVertices.sort((a, b) => {
		const angleA = Math.atan2(a.z - center.z, a.x - center.x);
		const angleB = Math.atan2(b.z - center.z, b.x - center.x);
		return angleA - angleB;
	});

	// Step 3: Create triangles
	const newFaces = [];
	for (let i = 0; i < sorted.length; i++) {
		const a = center;
		const b = sorted[i];
		const c = sorted[(i + 1) % sorted.length]; // Wrap around to the first vertex
		newFaces.push(a.clone(), b.clone(), c.clone());
	}

	// Step 4: Add new triangles to the geometry
	const newGeometry = new BufferGeometry().setFromPoints(newFaces);
	// Optionally merge this newGeometry with the original geometry

	return newGeometry;
}

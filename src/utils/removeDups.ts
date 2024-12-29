import { type BufferGeometry, Float32BufferAttribute, Vector3 } from "three";

export function removeDuplicateVertices(geometry: BufferGeometry) {
	const positionArray = geometry.attributes.position.array;
	const uniqueVertices = new Map(); // To store unique vertices
	const indices = []; // To map old vertices to new unique vertices
	const newPositions = []; // For the new positions array

	const vector = new Vector3();

	for (let i = 0; i < positionArray.length; i += 3) {
		// Extract vertex as a string key
		vector.set(positionArray[i], positionArray[i + 1], positionArray[i + 2]);
		const key = `${vector.x},${vector.y},${vector.z}`;

		if (!uniqueVertices.has(key)) {
			uniqueVertices.set(key, newPositions.length / 3);
			newPositions.push(vector.x, vector.y, vector.z);
		}

		indices.push(uniqueVertices.get(key)); // Map index
	}

	// Update geometry with the deduplicated positions
	geometry.setAttribute(
		"position",
		new Float32BufferAttribute(newPositions, 3),
	);

	// Optional: Update indices if needed (useful for indexed geometry)
	geometry.setIndex(indices);

	geometry.computeVertexNormals(); // Recompute normals after modification

	return geometry;
}

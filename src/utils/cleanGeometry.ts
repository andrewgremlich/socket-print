import { BufferGeometry, Vector3 } from "three";

/**
 * Cleans the geometry by removing internal vertices.
 * @param geometry The geometry to clean
 * @returns A new geometry with only external vertices
 */
export function cleanGeometry(geometry: BufferGeometry): BufferGeometry {
	const positionAttribute = geometry.attributes.position;
	const vertices: Vector3[] = [];

	for (let i = 0; i < positionAttribute.count; i++) {
		const x = positionAttribute.getX(i);
		const y = positionAttribute.getY(i);
		const z = positionAttribute.getZ(i);

		// Check if the vertex is on the surface (dummy function, needs improvement)
		if (isOnSurface(x, y, z)) {
			vertices.push(new Vector3(x, y, z));
		}
	}

	// Create a new geometry from the remaining vertices
	const cleanedGeometry = new BufferGeometry().setFromPoints(vertices);
	return cleanedGeometry;
}

/**
 * Dummy function to determine if a vertex is on the surface.
 * In a real implementation, this function should be based on your slicing logic.
 * @param x The X coordinate of the vertex
 * @param y The Y coordinate of the vertex
 * @param z The Z coordinate of the vertex
 * @returns True if the vertex is on the surface, otherwise false
 */
function isOnSurface(x: number, _y: number, _z: number): boolean {
	// Add complex logic here to determine whether a vertex is internal or external
	return true; // Placeholder logic, customize based on your needs
}

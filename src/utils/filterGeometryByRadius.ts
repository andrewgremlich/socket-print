import { BufferAttribute, BufferGeometry, Vector3 } from "three";

export function filterGeometryByRadius(
	bufferGeometry: BufferGeometry,
	distalCupRadius: number,
	center: Vector3,
) {
	// Get the position attribute from the buffer geometry
	const position = bufferGeometry.getAttribute("position");
	const vertices = [];

	// Loop through the vertices
	for (let i = 0; i < position.count; i++) {
		const vertex = new Vector3(
			position.getX(i),
			position.getY(i),
			position.getZ(i),
		);

		// Calculate distance to the center
		const distance = vertex.distanceTo(center);

		// Only keep vertices outside the distal cup radius
		if (distance >= distalCupRadius) {
			vertices.push(vertex.x, vertex.y, vertex.z);
		}
	}

	// Create a new BufferGeometry with the filtered vertices
	const newGeometry = new BufferGeometry();
	const filteredPosition = new Float32Array(vertices);

	newGeometry.setAttribute(
		"position",
		new BufferAttribute(filteredPosition, 3),
	);
	return newGeometry;
}

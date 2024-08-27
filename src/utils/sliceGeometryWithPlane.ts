import {
	BufferGeometry,
	Float32BufferAttribute,
	Line3,
	type Plane,
	Vector3,
} from "three";

export function sliceGeometryWithPlane(
	geometry: BufferGeometry,
	plane: Plane,
): BufferGeometry {
	const slicedGeometry = new BufferGeometry();
	const vertices = [];
	const positionAttribute = geometry.attributes.position;

	for (let i = 0; i < positionAttribute.count; i += 3) {
		const points = [
			new Vector3().fromBufferAttribute(positionAttribute, i),
			new Vector3().fromBufferAttribute(positionAttribute, i + 1),
			new Vector3().fromBufferAttribute(positionAttribute, i + 2),
		];

		const intersects = [];

		for (let j = 0; j < 3; j++) {
			const p1 = points[j];
			const p2 = points[(j + 1) % 3];
			const line = new Line3(p1, p2);
			const intersectionPoint = new Vector3();
			if (plane.intersectLine(line, intersectionPoint)) {
				intersects.push(intersectionPoint);
			}
		}

		if (intersects.length === 2) {
			vertices.push(...intersects[0].toArray(), ...intersects[1].toArray());
		}
	}

	slicedGeometry.setAttribute(
		"position",
		new Float32BufferAttribute(vertices, 3),
	);

	return slicedGeometry;
}

import type { BufferAttribute, Vector3 } from "three";

type Data = {
	position: BufferAttribute;
	center: Vector3;
	height: { miny: number; maxy: number };
};

function calculateDistance(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): number {
	return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function calculateTheta(x: number, z: number): number {
	return Math.atan2(z, x);
}

export function processGeometry(data: Data) {
	console.log(data.height.miny, data.height.maxy);
	console.log(data.position.array);

	for (let i = 0; i < data.position.count; i++) {
		const x = data.position.getX(i);
		const y = data.position.getY(i);
		const z = data.position.getZ(i);

		console.log(
			y,
			calculateTheta(x, z),
			calculateDistance(x, z, data.center.x, data.center.z),
		);
	}
}

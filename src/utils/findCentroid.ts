import { type Mesh, Vector3 } from "three";

export function findCentroid(model: Mesh, maxHeight?: number): Vector3 {
	const positions = model.geometry.attributes.position;

	let meanX = 0;
	let meanY = 0;
	let meanZ = 0;
	let initialY = 0;

	for (let i = 0; i < positions.count; i++) {
		const x = positions.getX(i);
		const y = positions.getY(i);
		const z = positions.getZ(i);
		const heightDifference = y - initialY;

		if (maxHeight && heightDifference > maxHeight) {
			break;
		}

		if (i === 0) {
			initialY = y;
		}

		meanX += x;
		meanY += y;
		meanZ += z;
	}

	meanX /= positions.count;
	meanY /= positions.count;
	meanZ /= positions.count;

	return new Vector3(meanX, meanY, meanZ);
}

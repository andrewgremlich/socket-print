import { DoubleSide, Mesh, MeshBasicMaterial, RingGeometry } from "three";

import type { RawPoint } from "@/3d/blendMerge";
import { CIRCULUAR_SEGMENTS } from "@/utils/constants";

import { AppObject } from "./AppObject";

// TODO: make sure to center according to the socket.
export class Ring extends AppObject {
	constructor() {
		super();

		const geometry = new RingGeometry(66.2 / 2, 78 / 2, CIRCULUAR_SEGMENTS);
		const material = new MeshBasicMaterial({
			color: 0xe84656,
			side: DoubleSide,
		});

		this.mesh = new Mesh(geometry, material);

		this.mesh.rotateX(Math.PI / 2);
	}

	setPosition(point: RawPoint) {
		if (!this.mesh) {
			throw new Error("Mesh not found");
		}

		const { x, y, z } = point;

		this.mesh.position.set(x, y, z);
	}
}

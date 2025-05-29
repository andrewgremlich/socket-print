import {
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";

import { AppObject } from "./AppObject";

export class MergeCup extends AppObject {
	#radialSegments = 128;
	#radius = 78 / 2;
	height: number;

	constructor(options: { height: number }) {
		super();

		this.height = options.height;

		const material = new MeshStandardMaterial({
			color: 0xffffff,
			side: DoubleSide,
		});
		const geometry = new CylinderGeometry(
			this.#radius,
			this.#radius,
			this.height,
			this.#radialSegments,
			1,
			true,
		);

		this.mesh = new Mesh(geometry, material);
		this.mesh.position.set(0, this.height / 2, 0);
		this.updateMatrixWorld();
	}
}

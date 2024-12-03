import { Mesh, MeshStandardMaterial, SphereGeometry } from "three";

import { AppObject } from "./AppObject";

export class EllipsoidFiller extends AppObject {
	constructor() {
		super();

		const material = new MeshStandardMaterial({
			color: 0xffffff,
		});
		const ellipsoidFiller = new SphereGeometry(32, 32, 64);

		this.mesh = new Mesh(ellipsoidFiller, material);

		this.mesh.scale.set(1, 1.5, 1);
	}
}

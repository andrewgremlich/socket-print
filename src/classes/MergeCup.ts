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

	constructor(options?: { height: number }) {
		super();

		this.height = options?.height ?? 0;

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

	setHeight(newHeight: number): void {
		this.height = newHeight;

		// Create new geometry with updated height
		const newGeometry = new CylinderGeometry(
			this.#radius,
			this.#radius,
			this.height,
			this.#radialSegments,
			1,
			true,
		);

		// Dispose of old geometry to prevent memory leaks
		this.mesh.geometry.dispose();

		// Update mesh with new geometry
		this.mesh.geometry = newGeometry;

		// Update mesh position to account for new height
		this.mesh.position.set(0, this.height / 2, 0);

		// Update matrix world to reflect changes
		this.updateMatrixWorld();
	}
}

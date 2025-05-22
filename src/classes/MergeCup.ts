import {
	BufferAttribute,
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";

import { AppObject } from "./AppObject";

// TODO: make sure to center according to the socket.
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

	toMergeCompatible = () => {
		if (!this.mesh) {
			throw new Error("Geometry or mesh is missing");
		}

		const nonIndexCylinder = this.mesh.geometry.toNonIndexed();

		if (!nonIndexCylinder.attributes.normal) {
			nonIndexCylinder.computeVertexNormals();
		}

		if (!nonIndexCylinder.attributes.uv) {
			const uvSphere = new Float32Array(
				nonIndexCylinder.attributes.position.count * 2,
			);

			nonIndexCylinder.setAttribute("uv", new BufferAttribute(uvSphere, 2));
		}

		return nonIndexCylinder;
	};
}

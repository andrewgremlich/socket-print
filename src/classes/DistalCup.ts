import {
	BufferAttribute,
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";

import { AppObject } from "./AppObject";

// Distal Cup configuration
export class DistalCup extends AppObject {
	#radialSegments = 128;
	#radius = 78 / 2;
	height: number;

	constructor(options: { openEnded: boolean } = { openEnded: true }) {
		super();

		this.height = 41.3;

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
			options.openEnded,
		);

		this.mesh = new Mesh(geometry, material);
		this.mesh.position.set(0, this.height / 2, 0);

		this.updateMatrixWorld();
	}

	updateMatrixWorld = () => {
		if (this.mesh) {
			this.mesh.updateMatrixWorld(true);

			this.mesh.geometry.applyMatrix4(this.mesh.matrixWorld);

			this.mesh.rotation.set(0, 0, 0);
			this.mesh.position.set(0, 0, 0);

			this.mesh.geometry.computeVertexNormals();
			this.mesh.geometry.computeBoundingBox();
		}
	};

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

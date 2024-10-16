import type GUI from "lil-gui";
import {
	BufferAttribute,
	CylinderGeometry,
	Mesh,
	MeshStandardMaterial,
} from "three";

import { getGui } from "@/utils/gui";

export class Cylinder {
	geometry: CylinderGeometry;
	#gui: GUI;

	mesh: Mesh;

	constructor() {
		const radialSegments = 64;
		const radius = 34;
		const height = 34;
		const material = new MeshStandardMaterial({
			color: 0xffffff,
		});

		this.geometry = new CylinderGeometry(
			radius,
			radius,
			height,
			radialSegments,
		);
		this.mesh = new Mesh(this.geometry, material);
		this.#gui = getGui();

		this.#addGui();
	}

	toMergeCompatible = () => {
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

	updateMatrixWorld = () => {
		this.mesh.updateMatrixWorld(true);
		this.geometry.applyMatrix4(this.mesh.matrixWorld);

		this.mesh.rotation.set(0, 0, 0);
		this.mesh.position.set(0, 0, 0);
	};

	#addGui() {
		const cylinderPosition = this.#gui.addFolder("Cylinder Position");

		cylinderPosition.add(this.mesh.position, "x", -100, 100, 1).name("X");
		cylinderPosition.add(this.mesh.position, "y", -100, 100, 1).name("Y");
		cylinderPosition.add(this.mesh.position, "z", -100, 100, 1).name("Z");
	}
}

import type GUI from "lil-gui";
import {
	BufferAttribute,
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshBasicMaterial,
} from "three";

import { getGui } from "@/utils/gui";

export class Cylinder {
	#geometry: CylinderGeometry;
	#gui: GUI;

	mesh: Mesh;

	constructor() {
		const radialSegments = 32;
		const radius = 14;
		const height = 24;
		const material = new MeshBasicMaterial({
			color: 0xffffff,
			side: DoubleSide,
			wireframe: true,
		});

		this.#geometry = new CylinderGeometry(
			radius,
			radius,
			height,
			radialSegments,
		);
		this.mesh = new Mesh(this.#geometry, material);
		this.#gui = getGui();

		this.#addGui();
	}

	toMergeCompatible = () => {
		const meshCopy = this.mesh.clone();
		const nonIndexCylinder = meshCopy.geometry.toNonIndexed();

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

	#addGui() {
		const cylinderPosition = this.#gui.addFolder("Cylinder Position");

		cylinderPosition.add(this.mesh.position, "x", -100, 100, 1).name("X");
		cylinderPosition.add(this.mesh.position, "y", -100, 100, 1).name("Y");
		cylinderPosition.add(this.mesh.position, "z", -100, 100, 1).name("Z");
	}
}

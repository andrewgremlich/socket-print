import type GUI from "lil-gui";
import {
	BufferAttribute,
	CylinderGeometry,
	Mesh,
	MeshBasicMaterial,
} from "three";

import { getGui } from "@/utils/gui";

export class Cylinder {
	#geometry: CylinderGeometry;
	#material: MeshBasicMaterial;
	#gui: GUI;

	mesh: Mesh;

	constructor({
		radius,
		height,
		color,
	}: {
		radius: number;
		height: number;
		color: number;
	}) {
		const radialSegments = 32; // Segments for smoothness

		this.#geometry = new CylinderGeometry(
			radius,
			radius,
			height,
			radialSegments,
		);
		this.#material = new MeshBasicMaterial({ color, wireframe: true });
		this.mesh = new Mesh(this.#geometry, this.#material);
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
		const cylinderRotation = this.#gui.addFolder("Cylinder Rotation");
		const cylinderPosition = this.#gui.addFolder("Cylinder Position");

		cylinderRotation
			.add(this.mesh.rotation, "x", 0, Math.PI * 2, 0.01)
			.name("Rotation X");
		cylinderRotation
			.add(this.mesh.rotation, "y", 0, Math.PI * 2, 0.01)
			.name("Rotation Y");
		cylinderRotation
			.add(this.mesh.rotation, "z", 0, Math.PI * 2, 0.01)
			.name("Rotation Z");

		cylinderPosition
			.add(this.mesh.position, "x", -15, 15, 0.1)
			.name("Position X");
		cylinderPosition
			.add(this.mesh.position, "y", -15, 15, 0.1)
			.name("Position Y");
		cylinderPosition
			.add(this.mesh.position, "z", -15, 15, 0.1)
			.name("Position Z");
	}
}

import type GUI from "lil-gui";
import {
	BufferAttribute,
	CylinderGeometry,
	Mesh,
	MeshStandardMaterial,
} from "three";

import { getGui } from "@/utils/gui";

import { AppObject, type AppObjectFunctions } from "./AppObject";

export class Cylinder extends AppObject implements AppObjectFunctions {
	#gui: GUI;
	#cylinderGui: GUI;
	#radialSegments = 30;
	#radius = 78 / 2;
	height: number;

	constructor(options: { openEnded: boolean } = { openEnded: true }) {
		super();

		this.height = 40;

		const material = new MeshStandardMaterial({
			color: 0xffffff,
			wireframe: true,
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

		this.#gui = getGui();
		this.#cylinderGui = this.#gui.addFolder("Cylinder Position");

		this.addGui();
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

	addGui() {
		if (!this.mesh) {
			throw new Error("Mesh is missing");
		}

		this.#cylinderGui.add(this.mesh.position, "x", -500, 500, 1).name("X");
		this.#cylinderGui.add(this.mesh.position, "y", -500, 500, 1).name("Y");
		this.#cylinderGui.add(this.mesh.position, "z", -500, 500, 1).name("Z");

		this.#cylinderGui.add(this.mesh.scale, "y", 0.1, 2, 0.1).name("Height");
	}

	removeGui() {
		this.#cylinderGui.destroy();
	}
}

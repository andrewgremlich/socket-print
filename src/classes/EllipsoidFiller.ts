import type GUI from "lil-gui";
import { Mesh, MeshStandardMaterial, SphereGeometry } from "three";

import { getGui } from "@/utils/gui";

import { AppObject, type AppObjectFunctions } from "./AppObject";

export class EllipsoidFiller extends AppObject implements AppObjectFunctions {
	#gui: GUI;
	#ellipsoidGui: GUI;

	constructor() {
		super();

		this.#gui = getGui();

		const material = new MeshStandardMaterial({
			color: 0xffffff,
		});
		const ellipsoidFiller = new SphereGeometry(32, 32, 64);

		this.mesh = new Mesh(ellipsoidFiller, material);
		this.#ellipsoidGui = this.#gui.addFolder("Ellipsoid Filler Position");

		this.mesh.scale.set(1, 1.5, 1);

		this.addGui();
	}

	addGui() {
		if (!this.mesh) {
			throw new Error("Ellipsoid mesh not found");
		}

		this.#ellipsoidGui.add(this.mesh.position, "x", -100, 100, 1).name("X");
		this.#ellipsoidGui.add(this.mesh.position, "y", -100, 100, 1).name("Y");
		this.#ellipsoidGui.add(this.mesh.position, "z", -100, 100, 1).name("Z");

		this.#ellipsoidGui.add(this.mesh.scale, "x", 0, 10, 1).name("Scale X");
		this.#ellipsoidGui.add(this.mesh.scale, "y", 0, 10, 1).name("Scale Y");
		this.#ellipsoidGui.add(this.mesh.scale, "z", 0, 10, 1).name("Scale Z");
	}

	removeGui() {
		this.#ellipsoidGui.destroy();
	}
}

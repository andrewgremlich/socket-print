import type GUI from "lil-gui";
import { BoxGeometry, Mesh, MeshPhongMaterial } from "three";

import { getGui } from "@/utils/gui";

export class Cube {
	#geometry: BoxGeometry;
	#material: MeshPhongMaterial[];
	#gui: GUI;

	mesh: Mesh;

	constructor({
		size: { x, y, z },
		color,
	}: {
		size: { x: number; y: number; z: number };
		color: number;
	}) {
		this.#geometry = new BoxGeometry(x, y, z);
		this.#material = [
			new MeshPhongMaterial({ color }), // Right face
			new MeshPhongMaterial({ color }), // Left face
			new MeshPhongMaterial({ color }), // Top face
			new MeshPhongMaterial({ color }), // Bottom face
			new MeshPhongMaterial({ color }), // Front face
			new MeshPhongMaterial({ color }), // Back face
		];
		this.mesh = new Mesh(this.#geometry, this.#material);
		this.#gui = getGui();

		this.#addGui();
	}

	#addGui() {
		const folder = this.#gui.addFolder("Cube");

		folder.add(this.mesh.rotation, "x", 0, Math.PI * 2, 0.01);
		folder.add(this.mesh.rotation, "y", 0, Math.PI * 2, 0.01);
		folder.add(this.mesh.rotation, "z", 0, Math.PI * 2, 0.01);

		folder.open();
	}
}

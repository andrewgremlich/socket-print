import { GUI as GUIImport } from "dat.gui";
import * as THREE from "three";

export class Cube {
	#geometry: THREE.BoxGeometry;
	#material: THREE.MeshPhongMaterial[];
	#gui: GUIImport;

	mesh: THREE.Mesh;

	constructor({
		size: { x, y, z },
		color,
	}: {
		size: { x: number; y: number; z: number };
		color: number;
	}) {
		this.#geometry = new THREE.BoxGeometry(x, y, z);
		this.#material = [
			new THREE.MeshPhongMaterial({ color }), // Right face
			new THREE.MeshPhongMaterial({ color }), // Left face
			new THREE.MeshPhongMaterial({ color }), // Top face
			new THREE.MeshPhongMaterial({ color }), // Bottom face
			new THREE.MeshPhongMaterial({ color }), // Front face
			new THREE.MeshPhongMaterial({ color }), // Back face
		];
		this.mesh = new THREE.Mesh(this.#geometry, this.#material);
		this.#gui = new GUIImport();

		this.addGui();
	}

	addGui() {
		const folder = this.#gui.addFolder("Cube");

		folder.add(this.mesh.rotation, "x", 0, Math.PI * 2, 0.01);
		folder.add(this.mesh.rotation, "y", 0, Math.PI * 2, 0.01);
		folder.add(this.mesh.rotation, "z", 0, Math.PI * 2, 0.01);

		folder.open();
	}
}

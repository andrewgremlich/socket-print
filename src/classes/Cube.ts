import * as THREE from "three";

export class Cube {
	#geometry: THREE.BoxGeometry;
	#material: THREE.MeshPhongMaterial[];
	#mesh: THREE.Mesh;

	constructor() {
		this.#geometry = new THREE.BoxGeometry(1, 1, 1);
		this.#material = [
			new THREE.MeshPhongMaterial({ color: 0xd1383b }), // Right face
			new THREE.MeshPhongMaterial({ color: 0xd1383b }), // Left face
			new THREE.MeshPhongMaterial({ color: 0xd1383b }), // Top face
			new THREE.MeshPhongMaterial({ color: 0xd1383b }), // Bottom face
			new THREE.MeshPhongMaterial({ color: 0xd1383b }), // Front face
			new THREE.MeshPhongMaterial({ color: 0xd1383b }), // Back face
		];
		this.#mesh = new THREE.Mesh(this.#geometry, this.#material);
	}

	get mesh() {
		return this.#mesh;
	}
}

import { Mesh, MeshBasicMaterial, SphereGeometry, type Vector3 } from "three";

export class DebugPoint {
	geometry: SphereGeometry;
	material: MeshBasicMaterial;
	mesh: Mesh;

	constructor(point: Vector3) {
		this.geometry = new SphereGeometry(1, 16, 16);
		this.material = new MeshBasicMaterial({ color: 0xff0000 });
		this.mesh = new Mesh(this.geometry, this.material);

		this.mesh.position.copy(point);
	}
}

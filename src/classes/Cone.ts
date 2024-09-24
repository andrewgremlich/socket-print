import { getGui } from "@/utils/gui";
import type GUI from "lil-gui";
import { ConeGeometry, Mesh, MeshBasicMaterial } from "three";

export class Cone {
	#geometry: ConeGeometry;
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
		const radiusTop = 3; // Smaller radius (top of funnel)
		const radiusBottom = 3; // Larger radius (bottom of funnel)
		const radialSegments = 32; // Segments for smoothness

		this.#geometry = new ConeGeometry(
			radiusTop,
			height,
			radialSegments,
			1,
			true,
			0,
			Math.PI * 2,
		);
		this.#material = new MeshBasicMaterial({ color });
		this.mesh = new Mesh(this.#geometry, this.#material);
		this.#gui = getGui();

		this.#addGui();
	}

	#addGui() {
		const folder = this.#gui.addFolder("Cone");

		folder.add(this.mesh.rotation, "x", 0, Math.PI * 2, 0.01);
		folder.add(this.mesh.rotation, "y", 0, Math.PI * 2, 0.01);
		folder.add(this.mesh.rotation, "z", 0, Math.PI * 2, 0.01);

		folder.open();
	}
}

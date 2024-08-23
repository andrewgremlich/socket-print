import type GUI from "lil-gui";
import { LatheGeometry, Mesh, MeshBasicMaterial, Vector2 } from "three";

import { getGui } from "@/utils/gui";

export class LatheGeo {
	#gui: GUI;

	mesh: Mesh;

	constructor() {
		this.#gui = getGui();

		const points = [];
		for (let i = 0; i < 10; i++) {
			points.push(new Vector2(Math.sin(i * 0.2) * 10 + 5, (i - 5) * 2));
		}
		const geometry = new LatheGeometry(points);
		const material = new MeshBasicMaterial({ color: 0xffff00 });
		const lathe = new Mesh(geometry, material);

		this.mesh = lathe;

		this.#addLatheGui();
	}

	#addLatheGui = () => {
		const folder = this.#gui.addFolder("Lathe");

		folder.add(this.mesh.rotation, "x", 0, Math.PI * 2, 0.01);
		folder.add(this.mesh.rotation, "y", 0, Math.PI * 2, 0.01);
		folder.add(this.mesh.rotation, "z", 0, Math.PI * 2, 0.01);

		folder.open();
	};
}

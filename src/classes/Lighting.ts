import type GUI from "lil-gui";
import * as THREE from "three";

import { getGui } from "@/utils/gui";

export class Lighting {
	#gui: GUI;
	#name: string;

	directionalLight: THREE.DirectionalLight;
	directionalLightHelper: THREE.DirectionalLightHelper;

	constructor({
		color,
		intensity,
		position: { x, y, z },
		name,
	}: {
		color: number;
		intensity: number;
		position: { x: number; y: number; z: number };
		name: string;
	}) {
		this.directionalLight = new THREE.DirectionalLight(color, intensity);
		this.directionalLightHelper = new THREE.DirectionalLightHelper(
			this.directionalLight,
			3,
		);
		this.#gui = getGui();
		this.#name = name;

		this.directionalLight.position.set(x, y, z);

		if (import.meta.env.MODE === "development") {
			this.#addGui();
		} else {
			console.log("Production mode");
		}
	}

	#addGui() {
		const folder = this.#gui.addFolder(this.#name);

		folder.add(this.directionalLight.position, "x", -10, 10, 0.01);
		folder.add(this.directionalLight.position, "y", -10, 10, 0.01);
		folder.add(this.directionalLight.position, "z", -10, 10, 0.01);
		folder.add(this.directionalLight, "intensity", 0, 10, 0.01);

		folder.open();
	}
}

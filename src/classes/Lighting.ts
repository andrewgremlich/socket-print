import type GUI from "lil-gui";
import { AmbientLight, DirectionalLight, DirectionalLightHelper } from "three";

import { getGui } from "@/utils/gui";

export class Lighting {
	#gui: GUI;
	#name: string;

	ambientLight: AmbientLight;
	directionalLight: DirectionalLight;
	directionalLightHelper: DirectionalLightHelper;

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
		this.ambientLight = new AmbientLight(color);
		this.directionalLight = new DirectionalLight(color, intensity);
		this.directionalLightHelper = new DirectionalLightHelper(
			this.directionalLight,
			3,
		);
		this.#gui = getGui();
		this.#name = name;

		this.directionalLight.position.set(x, y, z);

		if (import.meta.env.MODE === "development") {
			this.#addGui();
		}
	}

	#addGui() {
		const folder = this.#gui.addFolder(this.#name);

		folder.add(this.directionalLight.position, "x", -10, 10, 0.5);
		folder.add(this.directionalLight.position, "y", -10, 10, 0.5);
		folder.add(this.directionalLight.position, "z", -10, 10, 0.5);
		folder.add(this.directionalLight, "intensity", 0, 10, 0.5);

		folder.open();
	}
}

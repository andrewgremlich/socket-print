import type GUI from "lil-gui";
import { AmbientLight, DirectionalLight, DirectionalLightHelper } from "three";

import { getGui } from "@/utils/gui";

export class Lighting {
	#gui: GUI;

	ambientLight: AmbientLight;
	directionalLight: DirectionalLight;
	directionalLightHelper?: DirectionalLightHelper;

	constructor() {
		this.ambientLight = new AmbientLight(0xffffff, 1);
		this.directionalLight = new DirectionalLight(0xffffff, 3);
		this.#gui = getGui();

		this.directionalLight.castShadow = true;
		this.directionalLight.position.set(100, 100, 100);
		this.ambientLight.position.set(0, 0, 0);

		if (import.meta.env.MODE === "development") {
			this.directionalLightHelper = new DirectionalLightHelper(
				this.directionalLight,
				5,
			);
			this.#addGui();
		}
	}

	#addGui() {
		const directionalLight = this.#gui.addFolder("Directional Light");
		// const ambientLight = this.#gui.addFolder("Ambient Light");

		directionalLight.add(this.directionalLight.position, "x", -100, 100, 10);
		directionalLight.add(this.directionalLight.position, "y", -100, 100, 10);
		directionalLight.add(this.directionalLight.position, "z", -100, 100, 10);
		directionalLight.add(this.directionalLight, "intensity", 0, 10, 0.25);

		// ambientLight.add(this.ambientLight.position, "x", -100, 100, 10);
		// ambientLight.add(this.ambientLight.position, "y", -100, 100, 10);
		// ambientLight.add(this.ambientLight.position, "z", -100, 100, 10);
		// ambientLight.add(this.ambientLight, "intensity", 0, 5, 0.1);
		// ambientLight.addColor(this.ambientLight, "color");
	}
}

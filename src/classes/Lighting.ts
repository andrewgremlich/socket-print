import { GUI as GUIImport } from "dat.gui";
import * as THREE from "three";

export class Lighting {
	#gui: GUIImport;

	directionalLight: THREE.DirectionalLight;
	directionalLightHelper: THREE.DirectionalLightHelper;

	constructor() {
		this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
		this.directionalLightHelper = new THREE.DirectionalLightHelper(
			this.directionalLight,
			5,
		);
		this.#gui = new GUIImport();

		this.directionalLight.position.set(0, 1, 0);
		this.addGui();
	}

	addGui() {
		const folder = this.#gui.addFolder("Lighting");

		folder.add(this.directionalLight.position, "x", -10, 10, 0.01);
		folder.add(this.directionalLight.position, "y", -10, 10, 0.01);
		folder.add(this.directionalLight.position, "z", -10, 10, 0.01);

		folder.open();
	}
}

import { GUI as GUIImport } from "dat.gui";
import * as THREE from "three";

export class Lighting {
	#gui: GUIImport;
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
		this.#gui = new GUIImport();
		this.#name = name;

		this.directionalLight.position.set(x, y, z);

		if (window.__SOCKET_PRINT_ENV__ === "development") {
			this.addGui();
		}
	}

	addGui() {
		const folder = this.#gui.addFolder(this.#name);

		folder.add(this.directionalLight.position, "x", -10, 10, 0.01);
		folder.add(this.directionalLight.position, "y", -10, 10, 0.01);
		folder.add(this.directionalLight.position, "z", -10, 10, 0.01);
		folder.add(this.directionalLight, "intensity", 0, 10, 0.01);

		folder.open();
	}
}

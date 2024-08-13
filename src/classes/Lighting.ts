import * as THREE from "three";

export class Lighting {
	#ambientLight: THREE.AmbientLight;
	#directionalLight: THREE.DirectionalLight;
	#directionalLightHelper: THREE.DirectionalLightHelper;

	constructor() {
		this.#ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		this.#directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
		this.#directionalLightHelper = new THREE.DirectionalLightHelper(
			this.#directionalLight,
			5,
		);

		this.#directionalLight.position.set(0, 1, 0);
	}

	get ambientLight() {
		return this.#ambientLight;
	}

	get directionalLight() {
		return this.#directionalLight;
	}

	get directionalLightHelper() {
		return this.#directionalLightHelper;
	}
}

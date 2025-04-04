import { AmbientLight, DirectionalLight } from "three";

export class Lighting {
	ambientLight: AmbientLight;
	directionalLight: DirectionalLight;

	constructor() {
		this.ambientLight = new AmbientLight(0xffffff, 1);
		this.directionalLight = new DirectionalLight(0xffffff, 3);

		this.directionalLight.position.set(100, 100, -300);
	}
}

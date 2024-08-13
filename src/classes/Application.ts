import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class Application {
	#scene: THREE.Scene;
	#camera: THREE.PerspectiveCamera;
	#renderer: THREE.WebGLRenderer;
	#controls: OrbitControls;
	#gridHelper: THREE.GridHelper;
	#raycaster: THREE.Raycaster;
	#mouse: THREE.Vector2;

	constructor() {
		this.#scene = new THREE.Scene();
		this.#camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000,
		);
		this.#renderer = new THREE.WebGLRenderer();
		this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
		this.#gridHelper = new THREE.GridHelper(10, 10);
		this.#raycaster = new THREE.Raycaster();
		this.#mouse = new THREE.Vector2();

		this.#renderer.setSize(window.innerWidth, window.innerHeight);
		this.#renderer.setAnimationLoop(this.#animate);

		this.#camera.position.set(5, 3, 9);

		this.addToScene(this.#gridHelper);

		document.body.appendChild(this.#renderer.domElement);
	}

	#animate = () => {
		// cube.rotation.x += 0.01;
		// cube.rotation.y += 0.01;

		// Update the raycaster
		this.#raycaster.setFromCamera(this.#mouse, this.#camera);

		// Calculate objects intersecting the picking ray
		// const intersects = this.#raycaster.intersectObject(cube);

		// if (intersects) {
		// intersects[0].object.material.color.set(0x0000ff);
		// material.color.set(0xff0000);
		// }

		this.#controls.update();
		this.#renderer.render(this.#scene, this.#camera);
	};

	addToScene(object: THREE.Object3D) {
		this.#scene.add(object);
	}
}

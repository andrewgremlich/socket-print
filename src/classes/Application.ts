import type GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { getGui } from "@/utils/gui";

export class Application {
	#scene: THREE.Scene;
	#camera: THREE.PerspectiveCamera;
	#renderer: THREE.WebGLRenderer;
	#controls: OrbitControls;
	#raycaster: THREE.Raycaster;
	#mouse: THREE.Vector2;
	#gui: GUI;

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
		this.#raycaster = new THREE.Raycaster();
		this.#mouse = new THREE.Vector2();

		this.#renderer.setSize(window.innerWidth, window.innerHeight);
		this.#renderer.setAnimationLoop(this.#animate);
		this.#renderer.setPixelRatio(window.devicePixelRatio);
		this.#gui = getGui();

		this.#camera.position.set(5, 3, 9);
		this.#controls.enableDamping = true;

		this.addToScene(new THREE.GridHelper(10, 10));
		this.#addGui();

		document.body.appendChild(this.#renderer.domElement);
		window.addEventListener("resize", this.#onWindowResize);
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

	#addGui = () => {
		const folder = this.#gui.addFolder("Camera");

		folder.add(this.#camera.position, "x", -10, 10, 0.01);
		folder.add(this.#camera.position, "y", -10, 10, 0.01);
		folder.add(this.#camera.position, "z", -10, 10, 0.01);

		folder.open();
	};

	addToScene = (object: THREE.Object3D) => {
		this.#scene.add(object);
	};

	#onWindowResize = () => {
		this.#camera.aspect = window.innerWidth / window.innerHeight;
		this.#camera.updateProjectionMatrix();
		this.#renderer.setSize(window.innerWidth, window.innerHeight);
		this.#renderer.setPixelRatio(window.devicePixelRatio);
	};
}

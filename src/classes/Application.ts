import type GUI from "lil-gui";
import {
	GridHelper,
	type Object3D,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { getGui } from "@/utils/gui";

export class Application {
	#scene: Scene;
	#camera: PerspectiveCamera;
	#renderer: WebGLRenderer;
	#controls: OrbitControls;
	#gui: GUI;

	constructor() {
		this.#scene = new Scene();
		this.#camera = new PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000,
		);
		this.#renderer = new WebGLRenderer();
		this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);

		this.#renderer.setSize(window.innerWidth, window.innerHeight);
		this.#renderer.setAnimationLoop(this.#animate);
		this.#renderer.setPixelRatio(window.devicePixelRatio);
		this.#gui = getGui();

		this.#camera.position.set(5, 3, 9);
		this.#controls.enableDamping = true;

		this.addToScene(new GridHelper(10, 10));

		if (import.meta.env.MODE === "development") {
			this.#addCameraGui();
		}

		document.body.appendChild(this.#renderer.domElement);
	}

	addToScene = (object: Object3D) => this.#scene.add(object);

	#animate = () => {
		this.#controls.update();
		this.#renderer.render(this.#scene, this.#camera);
	};

	#addCameraGui = () => {
		const folder = this.#gui.addFolder("Camera");

		folder.add(this.#camera.position, "x", -10, 10, 0.01);
		folder.add(this.#camera.position, "y", -10, 10, 0.01);
		folder.add(this.#camera.position, "z", -10, 10, 0.01);

		folder.open();
	};

	#onWindowResize = () => {
		this.#camera.aspect = window.innerWidth / window.innerHeight;
		this.#camera.updateProjectionMatrix();
		this.#renderer.setSize(window.innerWidth, window.innerHeight);
		this.#renderer.setPixelRatio(window.devicePixelRatio);
	};

	get camera() {
		return this.#camera;
	}
}

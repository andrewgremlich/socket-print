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
	camera: PerspectiveCamera;
	renderer: WebGLRenderer;
	controls: OrbitControls;
	gridHelper: GridHelper;
	#gui: GUI;

	constructor() {
		this.#scene = new Scene();
		this.camera = new PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000,
		);
		this.renderer = new WebGLRenderer({ antialias: true });
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.gridHelper = new GridHelper(200, 50);

		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setAnimationLoop(this.#animate);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.#gui = getGui();

		this.camera.position.set(0, -50, 0);
		this.controls.enableDamping = true;

		this.addToScene(this.gridHelper);

		if (import.meta.env.MODE === "development") {
			this.#addCameraGui();
		}

		document.body.appendChild(this.renderer.domElement);
	}

	addToScene = (object: Object3D) => this.#scene.add(object);

	#animate = () => {
		this.controls.update();
		this.renderer.render(this.#scene, this.camera);
	};

	#addCameraGui = () => {
		const folder = this.#gui.addFolder("Camera");

		folder.add(this.camera.position, "x", -100, 100, 10);
		folder.add(this.camera.position, "y", -100, 100, 10);
		folder.add(this.camera.position, "z", -100, 100, 10);

		folder.open();
	};

	// TODO: on resize change the camera aspect ratio
	// #onWindowResize = () => {
	// 	this.#camera.aspect = window.innerWidth / window.innerHeight;
	// 	this.#camera.updateProjectionMatrix();
	// 	this.#renderer.setSize(window.innerWidth, window.innerHeight);
	// 	this.#renderer.setPixelRatio(window.devicePixelRatio);
	// };
}

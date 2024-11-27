import {
	GridHelper,
	type Mesh,
	type Object3D,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class Application {
	scene: Scene;
	camera: PerspectiveCamera;
	renderer: WebGLRenderer;
	controls: OrbitControls;
	gridHelper: GridHelper;
	width: number;
	height: number;

	constructor() {
		const provelPrintView = document.getElementById("provelPrint");

		if (!provelPrintView) {
			throw new Error("Provel Print View not found");
		}

		if (!provelPrintView) {
			throw new Error("Provel Print View not found");
		}

		this.width = provelPrintView.clientWidth;
		this.height = provelPrintView.clientHeight;
		this.scene = new Scene();
		this.camera = new PerspectiveCamera(
			75,
			this.width / this.height,
			0.1,
			1000,
		);
		this.renderer = new WebGLRenderer({ antialias: true });
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.gridHelper = new GridHelper(200, 50);

		this.renderer.setSize(this.width, this.height);
		this.renderer.setAnimationLoop(this.#animate);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		this.camera.position.set(200, 100, 0);
		this.controls.enableDamping = true;

		this.addToScene(this.gridHelper);

		provelPrintView?.appendChild(this.renderer.domElement);

		// Add event listener for window resize
		window.addEventListener("resize", this.#onWindowResize);
	}

	addToScene = (object: Object3D) => this.scene.add(object);

	removeAllMeshesFromScene = () => {
		for (const object of this.scene.children) {
			if (object.type === "Mesh") {
				const obj = object as Mesh;

				if (obj.geometry) obj.geometry.dispose();

				if (obj.material) {
					if (Array.isArray(obj.material)) {
						for (const material of obj.material) {
							material.dispose();
						}
					} else {
						obj.material.dispose();
					}
				}

				this.scene.remove(obj);
			}
		}
	};

	#animate = () => {
		this.controls.update();
		this.renderer.render(this.scene, this.camera);
	};

	#onWindowResize = () => {
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.width, this.height);
		this.renderer.setPixelRatio(window.devicePixelRatio);
	};
}

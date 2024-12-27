import { threeDViewer } from "@/utils/htmlElements";
import {
	GridHelper,
	Mesh,
	MeshBasicMaterial,
	type Object3D,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader, TextGeometry } from "three/examples/jsm/Addons.js";

export class Application {
	#provelPrintView: HTMLElement | null = document.getElementById("provelPrint");

	scene: Scene;
	camera: PerspectiveCamera;
	renderer: WebGLRenderer;
	controls: OrbitControls;
	gridHelper: GridHelper;
	width: number;
	height: number;

	constructor() {
		if (!this.#provelPrintView) {
			throw new Error("Provel Print View not found");
		}

		this.width = this.#provelPrintView.clientWidth;
		this.height = this.#provelPrintView.clientHeight;
		this.scene = new Scene();
		this.camera = new PerspectiveCamera(
			75,
			this.width / this.height,
			0.1,
			1000,
		);
		this.renderer = new WebGLRenderer({ canvas: threeDViewer }); // TODO: this accepts offscreenCanvas
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.gridHelper = new GridHelper(200, 50);

		this.renderer.setSize(this.width, this.height);
		this.renderer.setAnimationLoop(this.#animate);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		this.camera.position.set(0, 100, 200);
		this.controls.enableDamping = true;

		this.addToScene(this.gridHelper);
		this.loadFont();

		// Add event listener for window resize
		window.addEventListener("resize", this.#onWindowResize);
	}

	addToScene = (object: Object3D) => this.scene.add(object);

	loadFont = () => {
		const loader = new FontLoader();

		loader.load("helvetiker_regular.typeface.json", (font) => {
			const anteriorViewLabel = new TextGeometry("Anterior", {
				font,
				size: 10,
				depth: 1,
			});
			const textMesh = new Mesh(
				anteriorViewLabel,
				new MeshBasicMaterial({ color: 0xffffff }),
			);

			textMesh.position.set(-20, 0, 100);

			this.addToScene(textMesh);
		});
	};

	#animate = () => {
		this.controls.update();
		this.renderer.render(this.scene, this.camera);
	};

	#onWindowResize = () => {
		if (this.#provelPrintView) {
			this.width = this.#provelPrintView.clientWidth;
			this.height = this.#provelPrintView.clientHeight;

			this.camera.aspect = this.width / this.height;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(this.width, this.height);
			this.renderer.setPixelRatio(window.devicePixelRatio);
		}
	};
}

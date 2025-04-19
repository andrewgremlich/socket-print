import { threeDViewer } from "@/utils/htmlElements";
import {
	AmbientLight,
	DirectionalLight,
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
		this.renderer = new WebGLRenderer({ canvas: threeDViewer });
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.gridHelper = new GridHelper(200, 50);
		const ambientLight = new AmbientLight(0xffffff, 1);
		const directionalLight1 = new DirectionalLight(0xffffff, 2);
		const directionalLight2 = new DirectionalLight(0xffffff, 2);

		directionalLight1.position.set(100, 100, -300);
		directionalLight2.position.set(100, 100, 300);
		this.renderer.setSize(this.width, this.height);
		this.renderer.setAnimationLoop(this.#animate);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		this.camera.position.set(0, 100, -200);
		this.controls.enableDamping = true;

		this.addToScene(this.gridHelper);
		this.addToScene(ambientLight);
		this.addToScene(directionalLight1);
		this.addToScene(directionalLight2);
		this.loadFont();

		window.addEventListener("resize", this.#onWindowResize);
	}

	resetCameraPosition = () => {
		this.camera.position.set(0, 100, -200);
	};

	addToScene = (object: Object3D) => this.scene.add(object);

	removeMeshFromScene = (mesh: Mesh) => this.scene.remove(mesh);

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

			textMesh.position.set(0, 0, -100);
			textMesh.rotation.x = -Math.PI / 2;
			textMesh.rotation.z = Math.PI;

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

import { pi } from "mathjs";
import type { BufferGeometry, Object3D } from "three";
import {
	AmbientLight,
	DirectionalLight,
	GridHelper,
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	RingGeometry,
	Scene,
	WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
	BufferGeometryUtils,
	FontLoader,
	TextGeometry,
} from "three/examples/jsm/Addons.js";
import { threeDViewer } from "@/utils/htmlElements";
import { TrimLine } from "./TrimLine";

export class Application {
	#provelPrintView: HTMLElement | null = document.getElementById("provelPrint");

	scene: Scene;
	camera: PerspectiveCamera;
	renderer: WebGLRenderer;
	controls: OrbitControls;
	gridHelper: GridHelper;
	trimLine: TrimLine;
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
		this.renderer = new WebGLRenderer({
			canvas: threeDViewer,
			antialias: true,
		});
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.gridHelper = new GridHelper(200, 50);
		const ambientLight = new AmbientLight(0xffffff, 1);
		const directionalLight1 = new DirectionalLight(0xffffff, 2);
		const directionalLight2 = new DirectionalLight(0xffffff, 2);
		const directionalLight3 = new DirectionalLight(0xffffff, 2);

		directionalLight1.position.set(100, 150, -300);
		directionalLight2.position.set(100, 150, 350);
		directionalLight3.position.set(-400, 150, 100);

		// Update only the drawing buffer size; let CSS control canvas size
		this.renderer.setSize(this.width, this.height, false);
		this.renderer.setAnimationLoop(this.#animate);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		this.camera.position.set(0, 100, -200);

		if (import.meta.env.PROD) {
			this.controls.minDistance = 200;
			this.controls.maxDistance = 500;
			this.controls.enableDamping = true;
		}

		this.trimLine = new TrimLine(
			this.scene,
			this.camera,
			threeDViewer,
			this.controls,
		);

		this.addToScene(this.gridHelper);
		this.addToScene(ambientLight);
		this.addToScene(directionalLight1);
		this.addToScene(directionalLight2);
		this.addToScene(directionalLight3);
		this.loadFont();

		window.addEventListener("resize", this.#onWindowResize);
	}

	collectAllGeometries = () => {
		const geometries: BufferGeometry[] = [];

		this.scene.traverse((object) => {
			if (
				object instanceof Mesh &&
				!(object.geometry instanceof TextGeometry) &&
				!(object.geometry instanceof RingGeometry) &&
				!object.userData.isTrimLine &&
				!object.userData.isTrimLinePoint &&
				!object.userData.isTrimLineShading
			) {
				// Clone geometry and apply the object's full world transform so slicing
				// sees the final, transformed vertices (scale, rotation, translation).
				const cloned = object.geometry.clone();
				cloned.applyMatrix4(object.matrixWorld);
				// Ensure all geometries are non-indexed for merging
				const nonIndexed = cloned.index ? cloned.toNonIndexed() : cloned;
				// Remove UV attributes to ensure all geometries are compatible for merging
				if (nonIndexed.hasAttribute("uv")) {
					nonIndexed.deleteAttribute("uv");
				}
				geometries.push(nonIndexed);
			}
		});

		return BufferGeometryUtils.mergeGeometries(geometries, false);
	};

	resetCameraPosition = () => {
		this.camera.position.set(0, 100, -200);
	};

	addToScene = (object: Object3D) => {
		this.scene.add(object);
	};

	removeMeshFromScene = (mesh: Mesh) => {
		this.scene.remove(mesh);
	};

	loadFont = () => {
		const loader = new FontLoader();

		loader.load(
			"helvetiker_regular.typeface.json",
			(font) => {
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
				textMesh.rotation.x = -pi / 2;
				textMesh.rotation.z = pi;

				this.addToScene(textMesh);
			},
			undefined,
			(error) => {
				console.error("Failed to load font:", error);
			},
		);
	};

	dispose = () => {
		window.removeEventListener("resize", this.#onWindowResize);
		this.trimLine.dispose();
		this.controls.dispose();
		this.renderer.dispose();
		this.scene.traverse((object) => {
			if (object instanceof Mesh) {
				object.geometry.dispose();
				if (Array.isArray(object.material)) {
					object.material.forEach((m) => {
						m.dispose();
					});
				} else {
					object.material.dispose();
				}
			}
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
			this.renderer.setSize(this.width, this.height, false);
		}
	};
}

import { pi } from "mathjs";
import type { BufferGeometry, Object3D } from "three";
import {
	AmbientLight,
	DirectionalLight,
	GridHelper,
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from "three";
import {
	BufferGeometryUtils,
	FontLoader,
	OrbitControls,
	TextGeometry,
	TransformControls,
} from "three/examples/jsm/Addons.js";
import { threeDViewer } from "@/utils/htmlElements";
import type { TransformControlsOptions } from "./types";

export class Application {
	#provelPrintView: HTMLElement | null = document.getElementById("provelPrint");

	scene: Scene;
	camera: PerspectiveCamera;
	renderer: WebGLRenderer;
	controls: OrbitControls;
	gridHelper: GridHelper;
	width: number;
	height: number;
	transformControls: TransformControls | null = null;

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

		this.addToScene(this.gridHelper);
		this.addToScene(ambientLight);
		this.addToScene(directionalLight1);
		this.addToScene(directionalLight2);
		this.addToScene(directionalLight3);
		this.loadFont();

		window.addEventListener("resize", this.#onWindowResize);
	}

	collectAllPrintableGeometries = () => {
		const geometries: BufferGeometry[] = [];

		this.scene.traverse((object) => {
			if (!(object instanceof Mesh)) return;

			const { isPrintObject, isSocketCup, isTransition } = object.userData;
			if (!isPrintObject && !isSocketCup && !isTransition) return;

			const cloned = object.geometry.clone();
			cloned.applyMatrix4(object.matrixWorld);
			const nonIndexed = cloned.index ? cloned.toNonIndexed() : cloned;
			if (nonIndexed.hasAttribute("uv")) {
				nonIndexed.deleteAttribute("uv");
			}
			geometries.push(nonIndexed);
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
		if (this.transformControls?.object === mesh) {
			this.detachTransformControls();
		}
		this.scene.remove(mesh);
	};

	attachTransformControls = (
		mesh: Mesh,
		options: TransformControlsOptions = {},
	): TransformControls => {
		const {
			mode = "rotate",
			showX = true,
			showY = true,
			showZ = true,
			size = 1,
			onChange,
		} = options;

		// Clean up existing transform controls if any
		this.detachTransformControls();

		this.transformControls = new TransformControls(
			this.camera,
			this.renderer.domElement,
		);
		this.transformControls.attach(mesh);
		this.transformControls.setMode(mode);
		this.transformControls.showX = showX;
		this.transformControls.showY = showY;
		this.transformControls.showZ = showZ;
		this.transformControls.size = size;

		// Disable OrbitControls while dragging TransformControls
		// and call onChange when dragging ends
		this.transformControls.addEventListener("dragging-changed", (event) => {
			this.controls.enabled = !event.value;

			// When dragging ends, call the onChange callback
			if (!event.value && onChange) {
				onChange();
			}
		});

		const helper = this.transformControls.getHelper();
		helper.visible = false;
		this.transformControls.enabled = false;
		this.scene.add(helper);

		return this.transformControls;
	};

	detachTransformControls = () => {
		if (this.transformControls) {
			this.transformControls.detach();
			// @ts-expect-error - TransformControls extends Object3D but types don't reflect this
			this.scene.remove(this.transformControls);
			this.transformControls.dispose();
			this.transformControls = null;
		}
	};

	toggleRotateTransformControls = (): boolean => {
		if (this.transformControls) {
			const helper = this.transformControls.getHelper();
			const newState = !helper.visible;
			helper.visible = newState;
			this.transformControls.enabled = newState;
			return newState;
		}
		return false;
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
		this.detachTransformControls();
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

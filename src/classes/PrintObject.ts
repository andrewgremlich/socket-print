import { abs, pi, round } from "mathjs";
import {
	type BufferGeometry,
	DoubleSide,
	Matrix4,
	Mesh,
	MeshStandardMaterial,
} from "three";
import { STLExporter } from "three/examples/jsm/Addons.js";
import { STLLoader as ThreeSTLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import {
	acceleratedRaycast,
	computeBoundsTree,
	disposeBoundsTree,
	MeshBVH,
} from "three-mesh-bvh";
import { ensureUV } from "@/3d/ensureUV";
import { applyOffset } from "@/3d/generateOffsetWithNormal";
import {
	getLockDepth,
	getRotateValues,
	getTranslateValues,
	updateRotateValues,
	updateTranslateValues,
} from "@/db/appSettingsDbActions";
import { getAllFiles, setFileByName } from "@/db/file";
import { getNozzleSize } from "@/db/formValuesDbActions";
import { getActiveMaterialProfileShrinkFactor } from "@/db/materialProfilesDbActions";
import { PrintObjectType } from "@/db/types";
import {
	activeFileName,
	addTestCylinderButton,
	addTestStlButton,
	collisionWarning,
	coronalRotater,
	depthTranslate,
	generateGCodeButton,
	horizontalTranslate,
	loadingScreen,
	printerFileInput,
	sagittalRotate,
	stlFileInput,
	transversalRotater,
	verticalTranslate,
} from "@/utils/htmlElements";
import { fetchStlFile, setStlFileInputAndDispatch } from "@/utils/printObject";
import { AppObject } from "./AppObject";
import type { SocketCup } from "./SocketCup";
import { TestCylinder } from "./TestCylinder";

type Callback = (params: { size: { x: number; y: number; z: number } }) => void;

export class PrintObject extends AppObject {
	callback: Callback;
	lockDepth: number | null = null;
	loadedStlFromIndexedDb = false;
	offsetYPosition = 0;
	currentType: PrintObjectType = undefined;
	tube: SocketCup;
	isCollidingWithTube: boolean = false;

	constructor({ callback, tube }: { callback: Callback; tube: SocketCup }) {
		super();

		this.callback = callback;
		this.tube = tube;

		if (!stlFileInput) {
			throw new Error("STL File Input not found");
		}

		getAllFiles()
			.then((files) => {
				if (files.length === 1) {
					const { file, name, type } = files[0];
					const stlFile = new File([file], name, {
						type: "model/stl",
					});

					this.currentType = type;
					this.loadedStlFromIndexedDb = true;

					setStlFileInputAndDispatch(stlFile);
				} else {
					this.loadedStlFromIndexedDb = false;
				}
			})
			.catch((error) => {
				console.error("Failed to load files from database:", error);
				this.loadedStlFromIndexedDb = false;
			});

		addTestStlButton?.addEventListener("click", async () => {
			try {
				await this.clearData();
				this.currentType = PrintObjectType.Socket;
				await fetchStlFile("test_stl_file.stl")();
			} catch (error) {
				console.error("Failed to load test STL:", error);
				loadingScreen.style.display = "none";
			}
		});
		addTestCylinderButton?.addEventListener("click", async () => {
			try {
				await this.clearData();
				this.currentType = PrintObjectType.TestCylinder;
				console.log("test cylinder clicked");
				await this.#handleTestCylinder();
			} catch (error) {
				console.error("Failed to create test cylinder:", error);
				loadingScreen.style.display = "none";
			}
		});

		stlFileInput?.addEventListener("change", async (evt) => {
			try {
				if (evt.isTrusted) {
					await this.clearData();
				}

				this.currentType = evt.isTrusted
					? PrintObjectType.Socket
					: this.currentType;

				await this.#onStlFileChange(evt);
			} catch (error) {
				console.error("Failed to process STL file:", error);
				loadingScreen.style.display = "none";
			}
		});

		coronalRotater?.addEventListener("click", this.coronalRotate90);
		sagittalRotate?.addEventListener("click", this.sagittalRotate90);
		transversalRotater?.addEventListener("click", this.transversalRotater90);
		verticalTranslate?.addEventListener("input", (evt) =>
			this.verticalChange(evt),
		);
		horizontalTranslate?.addEventListener("input", (evt) => {
			this.horizontalChange(evt);
		});
		depthTranslate?.addEventListener("input", (evt) => {
			this.depthChange(evt);
		});
	}

	applyShrinkScale = async () => {
		if (!this.mesh) {
			console.error("No Mesh found");
			return;
		}

		const shrinkFactor = await getActiveMaterialProfileShrinkFactor();
		const shrinkScale = 1 / (1 - shrinkFactor / 100);

		this.mesh.scale.set(shrinkScale, shrinkScale, shrinkScale);
	};

	applyNozzleSizeOffset = async () => {
		if (!this.mesh) {
			console.error("No Mesh found");
			return;
		}

		const nozzleSize = await getNozzleSize();
		this.mesh = await applyOffset(this.mesh, nozzleSize / 2);
	};

	#exportTestCylinder = async () => {
		if (!this.mesh) {
			console.error("No Mesh found");
			return;
		}

		const stlExporter = new STLExporter();
		const stlString = stlExporter.parse(this.mesh);
		const stlArrayBuffer = new TextEncoder().encode(stlString).buffer;

		const cylinderFile = new File([stlArrayBuffer], "test_cylinder.stl", {
			type: "model/stl",
		});
		await setFileByName(cylinderFile.name, {
			name: cylinderFile.name,
			type: PrintObjectType.TestCylinder,
			file: cylinderFile,
		});
	};

	#handleTestCylinder = async () => {
		console.log("create test cylinder");

		const testCylinder = await TestCylinder.create();

		this.mesh = testCylinder.mesh;

		console.log("apply size adjustments");

		// await this.applyShrinkScale(testCylinder.mesh);
		// await this.applyNozzleSizeOffset(testCylinder.mesh);

		console.log("assign name");

		this.mesh.name = "test_cylinder";
		activeFileName.textContent = "test_cylinder";

		this.#exportTestCylinder();

		this.computeBoundingBox();

		this.mesh.position.set(0, this.size.y / 2, 0);

		this.callback({
			size: {
				x: testCylinder.size.x,
				y: testCylinder.size.y,
				z: testCylinder.size.z,
			},
		});
	};

	#handleSocket = async (file: File) => {
		await setFileByName(file.name, {
			name: file.name,
			type: PrintObjectType.Socket,
			file: file,
		});

		loadingScreen.style.display = "flex";

		const rawGeometry = await this.#readSTLFile(file);

		rawGeometry.rotateX(-pi / 2);
		rawGeometry.rotateY(pi);
		ensureUV(rawGeometry);
		rawGeometry.computeVertexNormals();

		const material = new MeshStandardMaterial({
			color: 0xffffff,
			side: DoubleSide,
		});
		const mesh = new Mesh(rawGeometry, material);

		this.mesh = mesh;

		// await this.applyShrinkScale();
		// await this.applyNozzleSizeOffset();

		(this.mesh.material as MeshStandardMaterial).wireframe =
			import.meta.env.DEV;

		this.mesh.raycast = acceleratedRaycast;
		this.mesh.geometry.computeBoundsTree = computeBoundsTree;
		this.mesh.geometry.disposeBoundsTree = disposeBoundsTree;
		this.mesh.geometry.boundsTree = new MeshBVH(this.mesh.geometry);
		this.mesh.name = file.name.replace(/[<>"'&]/g, "");
		this.mesh.userData = { isSocket: true };
		this.computeBoundingBox();
		this.lockDepth = await getLockDepth();

		activeFileName.textContent = file.name.replace(/[<>"'&]/g, "");

		this.mesh.geometry.translate(
			-this.center.x,
			-this.center.y,
			-this.center.z,
		);

		const translateValues = await getTranslateValues();
		const rotateValues = await getRotateValues();

		this.offsetYPosition = this.size.y / 2 - this.lockDepth;

		if (this.loadedStlFromIndexedDb) {
			this.mesh.position.set(
				translateValues.x,
				translateValues.y,
				translateValues.z,
			);
		} else {
			this.mesh.position.set(0, this.offsetYPosition, 0);
		}

		this.mesh.rotation.set(
			rotateValues.coronal,
			rotateValues.sagittal,
			rotateValues.transverse,
		);

		await updateTranslateValues(
			this.mesh.position.x,
			this.mesh.position.y,
			this.mesh.position.z,
		);
		await updateRotateValues(
			rotateValues.coronal,
			rotateValues.sagittal,
			rotateValues.transverse,
		);

		horizontalTranslate.value = (-this.mesh.position.x).toString();
		verticalTranslate.value = round(
			this.mesh.position.y - this.offsetYPosition,
			0,
		).toString();
		depthTranslate.value = (-this.mesh.position.z).toString();

		this.callback({
			size: {
				x: this.size.x,
				y: this.size.y,
				z: this.size.z,
			},
		});

		this.toggleInput(false);
	};

	#onStlFileChange = async (event: Event) => {
		const { target: inputFiles } = event;
		const file = (inputFiles as HTMLInputElement).files?.[0];

		switch (this.currentType) {
			case PrintObjectType.Socket:
				if (!file) return;
				await this.#handleSocket(file);
				break;
			case PrintObjectType.TestCylinder:
				await this.#handleTestCylinder();
				break;
		}

		this.isIntersectingWithTube();
	};

	clearData = async () => {
		if (this.mesh) {
			this.mesh.geometry.dispose();
			this.mesh.removeFromParent();
			this.mesh = undefined;
		}

		this.boundingBox = undefined;
		this.center = undefined;
		this.size = undefined;
		this.loadedStlFromIndexedDb = false;
		this.currentType = undefined;

		await updateRotateValues(0, 0, 0);
		await updateTranslateValues(0, 0, 0);

		this.toggleInput(true);
	};

	toggleInput = (isDisabled: boolean) => {
		coronalRotater.disabled = isDisabled;
		sagittalRotate.disabled = isDisabled;
		transversalRotater.disabled = isDisabled;
		verticalTranslate.disabled = isDisabled;
		horizontalTranslate.disabled = isDisabled;
		depthTranslate.disabled = isDisabled;
	};

	#readSTLFile = async (file: File): Promise<BufferGeometry> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = async (e) => {
				const buffer = e.target?.result as ArrayBuffer;
				const loader = new ThreeSTLLoader();
				const geometry = loader.parse(buffer);
				resolve(geometry);
			};

			reader.onerror = () => reject(new Error("Failed to read STL file"));

			reader.readAsArrayBuffer(file);
		});
	};

	autoAlignMesh = () => {
		this.computeBoundingBox();
		const minY = this.boundingBox.min.y;

		this.mesh.position.x -= this.center.x;
		this.mesh.position.z -= this.center.z;

		if (minY < 0 && this.lockDepth !== null) {
			this.mesh.position.y += abs(minY) - this.lockDepth;
		}
	};

	isIntersectingWithTube = () => {
		if (!this.mesh || !this.tube?.mesh) return;

		this.mesh.updateMatrixWorld();
		this.tube.mesh.updateMatrixWorld();

		const transformMatrix = new Matrix4()
			.copy(this.tube.mesh.matrixWorld)
			.invert()
			.multiply(this.mesh.matrixWorld);

		const hit = this.tube.mesh.geometry.boundsTree.intersectsGeometry(
			this.mesh.geometry,
			transformMatrix,
		);

		if (hit) {
			collisionWarning.style.display = "block";
			generateGCodeButton.disabled = true;
			printerFileInput.disabled = true;
		} else {
			collisionWarning.style.display = "none";
			generateGCodeButton.disabled = false;
			printerFileInput.disabled = false;
		}

		this.isCollidingWithTube = hit;
	};

	handleRotationChange = async (axis: "x" | "y" | "z", amount: number) => {
		switch (axis) {
			case "x":
				this.mesh.rotateX(amount);
				break;
			case "y":
				this.mesh.rotateY(amount);
				break;
			case "z":
				this.mesh.rotateZ(amount);
				break;
		}
		this.autoAlignMesh();

		// Save rotation values to IndexedDB
		const currentRotateValues = await getRotateValues();
		await updateRotateValues(
			axis === "x"
				? currentRotateValues.coronal + amount
				: currentRotateValues.coronal,
			axis === "z"
				? currentRotateValues.sagittal + amount
				: currentRotateValues.sagittal,
			axis === "y"
				? currentRotateValues.transverse + amount
				: currentRotateValues.transverse,
		);

		this.isIntersectingWithTube();
	};

	coronalRotate90 = () => this.handleRotationChange("x", pi / 2);
	sagittalRotate90 = () => this.handleRotationChange("z", pi / 2);
	transversalRotater90 = () => this.handleRotationChange("y", pi / 2);

	handleTranslationChange = async (axis: "x" | "y" | "z", evt: Event) => {
		const targetValue = (evt.target as HTMLInputElement).value;
		const numVal = Number.parseInt(targetValue, 10);

		if (Number.isNaN(numVal)) return;

		switch (axis) {
			case "x":
				this.mesh.position.setX(-numVal);
				break;
			case "y":
				this.mesh.position.setY(numVal + this.offsetYPosition);
				break;
			case "z":
				this.mesh.position.setZ(-numVal);
				break;
		}

		await updateTranslateValues(
			this.mesh.position.x,
			this.mesh.position.y,
			this.mesh.position.z,
		);

		this.isIntersectingWithTube();
	};

	horizontalChange = (evt: Event) => this.handleTranslationChange("x", evt);
	verticalChange = (evt: Event) => this.handleTranslationChange("y", evt);
	depthChange = (evt: Event) => this.handleTranslationChange("z", evt);
}

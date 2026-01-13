import { abs, floor, round } from "mathjs";
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
	HALF_TURN,
	NOZZLE_SIZE_OFFSET_FACTOR,
	QUARTER_TURN,
} from "@/utils/constants";
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
	currentType: PrintObjectType | undefined = undefined;
	socketCup: SocketCup;
	isCollidingWithTube: boolean = false;
	#testCylinderInstance: TestCylinder | null = null;

	// Event listener references for cleanup
	#testStlClickHandler?: () => Promise<void>;
	#testCylinderClickHandler?: () => Promise<void>;
	#stlFileChangeHandler?: (evt: Event) => Promise<void>;
	#verticalInputHandler?: (evt: Event) => void;
	#horizontalInputHandler?: (evt: Event) => void;
	#depthInputHandler?: (evt: Event) => void;

	constructor({
		callback,
		socketCup,
	}: { callback: Callback; socketCup: SocketCup }) {
		super();

		this.callback = callback;
		this.socketCup = socketCup;

		if (!stlFileInput) {
			throw new Error("STL File Input not found");
		}

		this.#initializeFromDatabase();
		this.#attachEventListeners();
	}

	#initializeFromDatabase = async () => {
		try {
			const files = await getAllFiles();

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
		} catch (error) {
			console.error("Failed to load files from database:", error);
			this.loadedStlFromIndexedDb = false;
			this.#showError("Failed to load saved files from database");
		}
	};

	#showError = (message: string) => {
		console.error(message);
		// Could be extended to show user-facing error messages
		// For example: errorMessageElement.textContent = message;
	};

	#handleError = (error: unknown, userMessage: string) => {
		console.error(userMessage, error);
		loadingScreen.style.display = "none";
		this.#showError(userMessage);
	};

	#attachEventListeners = () => {
		this.#testStlClickHandler = async () => {
			try {
				await this.clearData();
				this.currentType = PrintObjectType.Socket;
				await fetchStlFile("test_stl_file.stl")();
			} catch (error) {
				this.#handleError(error, "Failed to load test STL file");
			}
		};

		this.#testCylinderClickHandler = async () => {
			try {
				await this.clearData();
				this.currentType = PrintObjectType.TestCylinder;
				await this.#handleTestCylinder();
			} catch (error) {
				this.#handleError(error, "Failed to create test cylinder");
			}
		};

		this.#stlFileChangeHandler = async (evt: Event) => {
			try {
				if (evt.isTrusted) {
					await this.clearData();
				}

				await this.#onStlFileChange(evt);
			} catch (error) {
				this.#handleError(error, "Failed to process STL file");
			}
		};

		this.#verticalInputHandler = (evt: Event) => this.verticalChange(evt);
		this.#horizontalInputHandler = (evt: Event) => this.horizontalChange(evt);
		this.#depthInputHandler = (evt: Event) => this.depthChange(evt);

		addTestStlButton?.addEventListener("click", this.#testStlClickHandler);
		addTestCylinderButton?.addEventListener(
			"click",
			this.#testCylinderClickHandler,
		);
		stlFileInput?.addEventListener("change", this.#stlFileChangeHandler);
		coronalRotater?.addEventListener("click", this.coronalRotate90);
		sagittalRotate?.addEventListener("click", this.sagittalRotate90);
		transversalRotater?.addEventListener("click", this.transversalRotater90);
		verticalTranslate?.addEventListener("input", this.#verticalInputHandler);
		horizontalTranslate?.addEventListener(
			"input",
			this.#horizontalInputHandler,
		);
		depthTranslate?.addEventListener("input", this.#depthInputHandler);
	};

	dispose = () => {
		// Dispose of test cylinder instance if it exists
		if (this.#testCylinderInstance) {
			this.#testCylinderInstance.dispose();
			this.#testCylinderInstance = null;
		}

		// Remove event listeners
		if (this.#testStlClickHandler) {
			addTestStlButton?.removeEventListener("click", this.#testStlClickHandler);
		}
		if (this.#testCylinderClickHandler) {
			addTestCylinderButton?.removeEventListener(
				"click",
				this.#testCylinderClickHandler,
			);
		}
		if (this.#stlFileChangeHandler) {
			stlFileInput?.removeEventListener("change", this.#stlFileChangeHandler);
		}
		coronalRotater?.removeEventListener("click", this.coronalRotate90);
		sagittalRotate?.removeEventListener("click", this.sagittalRotate90);
		transversalRotater?.removeEventListener("click", this.transversalRotater90);

		if (this.#verticalInputHandler) {
			verticalTranslate?.removeEventListener(
				"input",
				this.#verticalInputHandler,
			);
		}
		if (this.#horizontalInputHandler) {
			horizontalTranslate?.removeEventListener(
				"input",
				this.#horizontalInputHandler,
			);
		}
		if (this.#depthInputHandler) {
			depthTranslate?.removeEventListener("input", this.#depthInputHandler);
		}

		// Clean up mesh resources
		if (this.mesh) {
			this.mesh.geometry.dispose();
			if (Array.isArray(this.mesh.material)) {
				this.mesh.material.forEach((material) => {
					material.dispose();
				});
			} else {
				this.mesh.material.dispose();
			}
			this.mesh.removeFromParent();
		}

		// Clear references
		this.#testStlClickHandler = undefined;
		this.#testCylinderClickHandler = undefined;
		this.#stlFileChangeHandler = undefined;
		this.#verticalInputHandler = undefined;
		this.#horizontalInputHandler = undefined;
		this.#depthInputHandler = undefined;
	};

	applyShrinkScale = async () => {
		if (!this.mesh) {
			console.error("No Mesh found");
			return;
		}

		const shrinkFactor = await getActiveMaterialProfileShrinkFactor();
		const shrinkScale = floor(1 / (1 - shrinkFactor / 100), 4);

		this.mesh.scale.set(shrinkScale, shrinkScale, shrinkScale);
	};

	applyNozzleSizeOffset = async () => {
		if (!this.mesh) {
			console.error("No Mesh found");
			return;
		}

		const nozzleSize = await getNozzleSize();

		this.mesh = await applyOffset(
			this.mesh,
			nozzleSize / NOZZLE_SIZE_OFFSET_FACTOR,
		);
	};

	#exportTestCylinder = async () => {
		if (!this.mesh) {
			console.error("No Mesh found");
			return;
		}

		try {
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
		} catch (error) {
			console.error("Failed to export test cylinder to database:", error);
			this.#showError("Failed to save test cylinder");
		}
	};

	#handleTestCylinder = async () => {
		// Dispose of any existing test cylinder instance
		if (this.#testCylinderInstance) {
			this.#testCylinderInstance.dispose();
			this.#testCylinderInstance = null;
		}

		const testCylinder = await TestCylinder.create();
		this.#testCylinderInstance = testCylinder;

		// Subscribe to geometry changes
		testCylinder.onChange(async () => {
			await this.applyNozzleSizeOffset();
			await this.applyShrinkScale();
			this.computeBoundingBox();
			this.mesh.position.set(0, this.size.y / 2, 0);
			this.callback({ size: this.size });
			this.isIntersectingWithTube();
		});

		this.mesh = testCylinder.mesh;

		await this.applyNozzleSizeOffset();
		await this.applyShrinkScale();

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
		try {
			await setFileByName(file.name, {
				name: file.name,
				type: PrintObjectType.Socket,
				file: file,
			});
		} catch (error) {
			console.error("Failed to save file to database:", error);
			this.#showError("Failed to save file to database");
		}

		loadingScreen.style.display = "flex";

		const rawGeometry = await this.#readSTLFile(file);

		rawGeometry.rotateX(-QUARTER_TURN);
		rawGeometry.rotateY(HALF_TURN);
		ensureUV(rawGeometry);
		rawGeometry.computeVertexNormals();

		const material = new MeshStandardMaterial({
			color: 0xffffff,
			side: DoubleSide,
			wireframe: import.meta.env.DEV,
		});
		const mesh = new Mesh(rawGeometry, material);

		this.mesh = mesh;

		await this.applyNozzleSizeOffset();
		await this.applyShrinkScale();

		this.mesh.raycast = acceleratedRaycast;
		this.mesh.geometry.computeBoundsTree = computeBoundsTree;
		this.mesh.geometry.disposeBoundsTree = disposeBoundsTree;
		this.mesh.geometry.boundsTree = new MeshBVH(this.mesh.geometry);
		this.mesh.name = file.name.replace(/[<>"'&]/g, "");
		this.mesh.userData = { isSocket: true };
		this.computeBoundingBox();

		try {
			this.lockDepth = await getLockDepth();
		} catch (error) {
			console.error("Failed to get lock depth from database:", error);
			this.lockDepth = 0;
			this.#showError("Failed to load lock depth setting");
		}

		activeFileName.textContent = file.name.replace(/[<>"'&]/g, "");

		this.mesh.geometry.translate(
			-this.center.x,
			-this.center.y,
			-this.center.z,
		);

		let translateValues = { x: 0, y: 0, z: 0 };
		let rotateValues = { coronal: 0, sagittal: 0, transverse: 0 };

		try {
			translateValues = await getTranslateValues();
			rotateValues = await getRotateValues();
		} catch (error) {
			console.error("Failed to get transform values from database:", error);
			this.#showError("Failed to load position settings");
		}

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

		try {
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
		} catch (error) {
			console.error("Failed to save transform values to database:", error);
			this.#showError("Failed to save position settings");
		}

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
		// Dispose of test cylinder instance if it exists
		if (this.#testCylinderInstance) {
			this.#testCylinderInstance.dispose();
			this.#testCylinderInstance = null;
		}

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

		try {
			await updateRotateValues(0, 0, 0);
			await updateTranslateValues(0, 0, 0);
		} catch (error) {
			console.error("Failed to reset transform values in database:", error);
			this.#showError("Failed to reset position settings");
		}

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
		if (!this.mesh || !this.socketCup?.mesh) return;

		this.mesh.updateMatrixWorld();
		this.socketCup.mesh.updateMatrixWorld();

		const transformMatrix = new Matrix4()
			.copy(this.socketCup.mesh.matrixWorld)
			.invert()
			.multiply(this.mesh.matrixWorld);

		const hit = this.socketCup.mesh.geometry.boundsTree.intersectsGeometry(
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
		try {
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
		} catch (error) {
			console.error("Failed to save rotation values to database:", error);
			this.#showError("Failed to save rotation settings");
		}

		this.isIntersectingWithTube();
	};

	coronalRotate90 = () => this.handleRotationChange("x", QUARTER_TURN);
	sagittalRotate90 = () => this.handleRotationChange("z", QUARTER_TURN);
	transversalRotater90 = () => this.handleRotationChange("y", QUARTER_TURN);

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

		try {
			await updateTranslateValues(
				this.mesh.position.x,
				this.mesh.position.y,
				this.mesh.position.z,
			);
		} catch (error) {
			console.error("Failed to save translation values to database:", error);
			this.#showError("Failed to save position settings");
		}

		this.isIntersectingWithTube();
	};

	horizontalChange = (evt: Event) => this.handleTranslationChange("x", evt);
	verticalChange = (evt: Event) => this.handleTranslationChange("y", evt);
	depthChange = (evt: Event) => this.handleTranslationChange("z", evt);
}

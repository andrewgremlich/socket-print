import { floor, round } from "mathjs";
import {
	DoubleSide,
	Matrix4,
	Mesh,
	MeshStandardMaterial,
	type Scene,
} from "three";
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
	collisionWarning,
	depthTranslate,
	generateGCodeButton,
	horizontalTranslate,
	loadingScreen,
	printerFileInput,
	stlFileInput,
	verticalTranslate,
} from "@/utils/htmlElements";
import {
	applyRotation,
	applyTranslation,
	autoAlignMesh,
	saveRotationToDatabase,
	saveTranslationToDatabase,
	type TransformAxis,
} from "@/utils/meshTransforms";
import { fetchStlFile, setStlFileInputAndDispatch } from "@/utils/printObject";
import {
	attachPrintObjectEventListeners,
	detachPrintObjectEventListeners,
	type PrintObjectEventHandlers,
	toggleTransformInputs,
} from "@/utils/printObjectEvents";
import { exportMeshToDatabase, readSTLFile } from "@/utils/stlLoader";
import { AppObject } from "./AppObject";
import { CupToSocketTransition } from "./CupToSocketTransition";
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

	#testCylinderInstance: TestCylinder | null = null;
	#transitionInstance: CupToSocketTransition | null = null;
	#scene: Scene;
	#eventHandlers: PrintObjectEventHandlers | null = null;

	constructor({
		callback,
		socketCup,
		scene,
	}: { callback: Callback; socketCup: SocketCup; scene: Scene }) {
		super();

		this.callback = callback;
		this.socketCup = socketCup;
		this.#scene = scene;

		if (!stlFileInput) {
			throw new Error("STL File Input not found");
		}

		this.#initializeFromDatabase();
		this.#attachEventListeners();
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// Initialization
	// ─────────────────────────────────────────────────────────────────────────────

	#initializeFromDatabase = async () => {
		try {
			const files = await getAllFiles();

			if (files.length === 1) {
				const { file, name, type } = files[0];
				const stlFile = new File([file], name, { type: "model/stl" });

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

	#attachEventListeners = () => {
		this.#eventHandlers = {
			testStlClick: async () => {
				try {
					await this.clearData();
					this.currentType = PrintObjectType.Socket;
					await fetchStlFile("test_stl_file.stl")();
				} catch (error) {
					this.#handleError(error, "Failed to load test STL file");
				}
			},
			testCylinderClick: async () => {
				try {
					await this.clearData();
					this.currentType = PrintObjectType.TestCylinder;
					await this.#handleTestCylinder();
				} catch (error) {
					this.#handleError(error, "Failed to create test cylinder");
				}
			},
			stlFileChange: async (evt: Event) => {
				try {
					if (evt.isTrusted) {
						await this.clearData();
						this.currentType = PrintObjectType.Socket;
					}
					await this.#onStlFileChange(evt);
				} catch (error) {
					this.#handleError(error, "Failed to process STL file");
				}
			},
			coronalRotate: () => this.coronalRotate90(),
			sagittalRotate: () => this.sagittalRotate90(),
			transversalRotate: () => this.transversalRotater90(),
			verticalInput: (evt: Event) => this.verticalChange(evt),
			horizontalInput: (evt: Event) => this.horizontalChange(evt),
			depthInput: (evt: Event) => this.depthChange(evt),
		};

		attachPrintObjectEventListeners(this.#eventHandlers);
	};

	// ─────────────────────────────────────────────────────────────────────────────
	// Error Handling
	// ─────────────────────────────────────────────────────────────────────────────

	#showError = (message: string) => {
		console.error(message);
	};

	#handleError = (error: unknown, userMessage: string) => {
		console.error(userMessage, error);
		loadingScreen.style.display = "none";
		this.#showError(userMessage);
	};

	// ─────────────────────────────────────────────────────────────────────────────
	// Cleanup
	// ─────────────────────────────────────────────────────────────────────────────

	dispose = () => {
		this.#testCylinderInstance?.dispose();
		this.#testCylinderInstance = null;

		this.#transitionInstance?.dispose();
		this.#transitionInstance = null;

		if (this.#eventHandlers) {
			detachPrintObjectEventListeners(this.#eventHandlers);
			this.#eventHandlers = null;
		}

		if (this.mesh) {
			this.mesh.geometry.dispose();
			if (Array.isArray(this.mesh.material)) {
				for (const material of this.mesh.material) {
					material.dispose();
				}
			} else {
				this.mesh.material.dispose();
			}
			this.mesh.removeFromParent();
		}
	};

	clearData = async () => {
		this.#testCylinderInstance?.dispose();
		this.#testCylinderInstance = null;

		this.#transitionInstance?.dispose();
		this.#transitionInstance = null;

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

		toggleTransformInputs(true);
	};

	// ─────────────────────────────────────────────────────────────────────────────
	// Mesh Processing
	// ─────────────────────────────────────────────────────────────────────────────

	applyShrinkScale = async () => {
		if (!this.mesh) {
			console.error("No Mesh found");
			return;
		}

		const shrinkFactor = await getActiveMaterialProfileShrinkFactor();
		const shrinkScale = floor(1 / (1 - shrinkFactor / 100), 4);
		this.mesh.geometry.scale(shrinkScale, shrinkScale, shrinkScale);
	};

	applyNozzleSizeOffset = async () => {
		if (!this.mesh) {
			console.error("No Mesh found");
			return;
		}

		const nozzleSize = await getNozzleSize();
		const offsetAmount = nozzleSize / NOZZLE_SIZE_OFFSET_FACTOR;
		this.mesh = await applyOffset(this.mesh, offsetAmount);
	};

	autoAlignMesh = () => {
		this.computeBoundingBox();
		autoAlignMesh(this.mesh, this.boundingBox, this.center, this.lockDepth);
	};

	// ─────────────────────────────────────────────────────────────────────────────
	// Test Cylinder Handling
	// ─────────────────────────────────────────────────────────────────────────────

	#handleTestCylinder = async () => {
		this.#testCylinderInstance?.dispose();
		this.#testCylinderInstance = null;

		const testCylinder = await TestCylinder.create();
		this.#testCylinderInstance = testCylinder;

		testCylinder.onChange(async () => {
			await this.applyNozzleSizeOffset();
			await this.applyShrinkScale();
			this.computeBoundingBox();
			this.mesh.position.set(0, this.size.y / 2, 0);
			this.callback({ size: this.size });
		});

		this.mesh = testCylinder.mesh;

		await this.applyNozzleSizeOffset();
		await this.applyShrinkScale();

		this.mesh.name = "test_cylinder";
		activeFileName.textContent = "test_cylinder";

		try {
			await exportMeshToDatabase(
				this.mesh,
				"test_cylinder.stl",
				PrintObjectType.TestCylinder,
			);
		} catch (error) {
			console.error("Failed to export test cylinder to database:", error);
			this.#showError("Failed to save test cylinder");
		}

		this.computeBoundingBox();
		this.mesh.position.set(0, this.size.y / 2, 0);

		this.callback({
			size: {
				x: testCylinder.size.x,
				y: testCylinder.size.y,
				z: testCylinder.size.z,
			},
		});

		await this.isIntersectingWithSocketCup();
	};

	// ─────────────────────────────────────────────────────────────────────────────
	// Socket Handling
	// ─────────────────────────────────────────────────────────────────────────────

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

		const rawGeometry = await readSTLFile(file);

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
		this.mesh.geometry.boundsTree = new MeshBVH(this.mesh.geometry);

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
			rotateValues.transverse,
			rotateValues.sagittal,
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
			size: { x: this.size.x, y: this.size.y, z: this.size.z },
		});

		await this.#computeSocketTransition();

		toggleTransformInputs(false);
		loadingScreen.style.display = "none";
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

		await this.isIntersectingWithSocketCup();
	};

	// ─────────────────────────────────────────────────────────────────────────────
	// Collision Detection
	// ─────────────────────────────────────────────────────────────────────────────

	#computeSocketTransition = async () => {
		if (!this.mesh || this.currentType !== PrintObjectType.Socket) {
			return;
		}

		this.#transitionInstance?.dispose();
		this.#transitionInstance = null;

		this.mesh.updateMatrixWorld(true);

		this.#transitionInstance = await CupToSocketTransition.create(
			this.socketCup,
			this.mesh,
			this.#scene,
		);

		const result = await this.#transitionInstance.computeTransition();

		if (!result.isValid) {
			collisionWarning.textContent =
				"Imperfect fit: Socket does not fully cover the cup edge";
			collisionWarning.style.display = "block";
			generateGCodeButton.disabled = true;
			printerFileInput.disabled = true;
		}
	};

	isIntersectingWithSocketCup = async () => {
		if (!this.mesh || !this.socketCup?.mesh) return;

		this.mesh.updateMatrixWorld();
		this.socketCup.mesh.updateMatrixWorld();

		const transformMatrix = new Matrix4()
			.copy(this.socketCup.mesh.matrixWorld)
			.invert()
			.multiply(this.mesh.matrixWorld);

		const hit = (
			this.socketCup.mesh.geometry.boundsTree as MeshBVH
		).intersectsGeometry(this.mesh.geometry, transformMatrix);

		if (hit) {
			collisionWarning.textContent = "Interference!";
			collisionWarning.style.display = "block";
			generateGCodeButton.disabled = true;
			printerFileInput.disabled = true;
			return;
		}

		if (this.currentType === PrintObjectType.Socket) {
			await this.#computeSocketTransition();

			if (this.#transitionInstance && !this.#transitionInstance.isValidFit()) {
				return;
			}
		}

		collisionWarning.style.display = "none";
		generateGCodeButton.disabled = false;
		printerFileInput.disabled = false;
	};

	// ─────────────────────────────────────────────────────────────────────────────
	// Transformation Methods
	// ─────────────────────────────────────────────────────────────────────────────

	handleRotationChange = async (axis: TransformAxis, amount: number) => {
		applyRotation(this.mesh, axis, amount);
		this.autoAlignMesh();

		try {
			await saveRotationToDatabase(this.mesh);
		} catch (error) {
			console.error("Failed to save rotation values to database:", error);
			this.#showError("Failed to save rotation settings");
		}

		await this.isIntersectingWithSocketCup();
	};

	coronalRotate90 = () => this.handleRotationChange("x", QUARTER_TURN);
	sagittalRotate90 = () => this.handleRotationChange("z", QUARTER_TURN);
	transversalRotater90 = () => this.handleRotationChange("y", QUARTER_TURN);

	handleTranslationChange = async (axis: TransformAxis, evt: Event) => {
		const targetValue = (evt.target as HTMLInputElement).value;
		const numVal = Number.parseInt(targetValue, 10);

		if (Number.isNaN(numVal)) return;

		applyTranslation(this.mesh, axis, numVal, this.offsetYPosition);

		try {
			await saveTranslationToDatabase(this.mesh);
		} catch (error) {
			console.error("Failed to save translation values to database:", error);
			this.#showError("Failed to save position settings");
		}

		await this.isIntersectingWithSocketCup();
	};

	horizontalChange = (evt: Event) => this.handleTranslationChange("x", evt);
	verticalChange = (evt: Event) => this.handleTranslationChange("y", evt);
	depthChange = (evt: Event) => this.handleTranslationChange("z", evt);

	getTransitionInstance(): CupToSocketTransition | null {
		return this.#transitionInstance;
	}
}

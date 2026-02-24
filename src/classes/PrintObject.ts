import { floor } from "mathjs";
import { DoubleSide, Mesh, MeshStandardMaterial, type Scene } from "three";
import {
	acceleratedRaycast,
	computeBoundsTree,
	disposeBoundsTree,
	MeshBVH,
} from "three-mesh-bvh";
import { ensureUV } from "@/3d/ensureUV";
import { applyOffset } from "@/3d/generateOffsetWithNormal";
import { getLockDepth } from "@/db/appSettingsDbActions";
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
	generateGCodeButton,
	loadingScreen,
	printerFileInput,
	stlFileInput,
} from "@/utils/htmlElements";
import { setStlFileInputAndDispatch } from "@/utils/printObject";
import { exportMeshToDatabase, readSTLFile } from "@/utils/stlLoader";
import { AppObject } from "./AppObject";
import { CollisionDetector } from "./CollisionDetector";
import type { CupToSocketTransition } from "./CupToSocketTransition";
import { MeshTransformController } from "./MeshTransformController";
import { PrintObjectEventManager } from "./PrintObjectEventManager";
import type { SocketCup } from "./SocketCup";
import { TestCylinder } from "./TestCylinder";
import type {
	CollisionState,
	ICollisionDetector,
	IEventManager,
	IMeshTransformController,
	TransformAxis,
} from "./types";

type Callback = (params: { size: { x: number; y: number; z: number } }) => void;

export class PrintObject extends AppObject {
	callback: Callback;
	lockDepth: number | null = null;
	loadedStlFromIndexedDb = false;
	offsetYPosition = 0;
	currentType: PrintObjectType | undefined = undefined;
	socketCup: SocketCup;

	#testCylinderInstance: TestCylinder | null = null;

	// Composed controllers (typed to interfaces for testability)
	#transformController: IMeshTransformController;
	#collisionDetector: ICollisionDetector;
	#eventManager: IEventManager;

	constructor({
		callback,
		socketCup,
		scene,
		// Allow dependency injection for testing
		transformController,
		collisionDetector,
		eventManager,
	}: {
		callback: Callback;
		socketCup: SocketCup;
		scene: Scene;
		transformController?: IMeshTransformController;
		collisionDetector?: ICollisionDetector;
		eventManager?: IEventManager;
	}) {
		super();

		this.callback = callback;
		this.socketCup = socketCup;

		if (!stlFileInput) {
			throw new Error("STL File Input not found");
		}

		// Initialize composed controllers (use injected or create defaults)
		this.#transformController =
			transformController ?? new MeshTransformController(this.#showError);
		this.#collisionDetector =
			collisionDetector ?? new CollisionDetector(socketCup, scene);

		this.#transformController.onTransformChange(async () => {
			await this.#checkCollisionAndUpdateUI();
		});

		this.#eventManager =
			eventManager ??
			new PrintObjectEventManager({
				onClearData: () => this.clearData(),
				onTestCylinder: () => this.#handleTestCylinder(),
				onStlFileChange: (evt) => this.#onStlFileChange(evt),
				onCoronalRotate: () => this.coronalRotate90(),
				onSagittalRotate: () => this.sagittalRotate90(),
				onTransversalRotate: () => this.transversalRotater90(),
				onVerticalChange: (evt) => this.verticalChange(evt),
				onHorizontalChange: (evt) => this.horizontalChange(evt),
				onDepthChange: (evt) => this.depthChange(evt),
				onError: (error, message) => this.#handleError(error, message),
				setCurrentType: (type) => {
					this.currentType = type;
				},
			});

		this.#initializeFromDatabase();
		this.#eventManager.attach();
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
	// UI Updates (centralized collision UI handling)
	// ─────────────────────────────────────────────────────────────────────────────

	#updateCollisionUI(state: CollisionState): void {
		if (state.hasCollision || state.hasInvalidFit) {
			collisionWarning.textContent = state.message ?? "";
			collisionWarning.style.display = "block";
			generateGCodeButton.disabled = true;
			printerFileInput.disabled = true;
		} else {
			collisionWarning.style.display = "none";
			generateGCodeButton.disabled = false;
			printerFileInput.disabled = false;
		}
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// Cleanup
	// ─────────────────────────────────────────────────────────────────────────────

	dispose = () => {
		this.#testCylinderInstance?.dispose();
		this.#testCylinderInstance = null;

		this.#collisionDetector.dispose();
		this.#eventManager.detach();
		this.#transformController.clear();

		if (this.mesh) {
			this.mesh.geometry.dispose();
			if (Array.isArray(this.mesh.material)) {
				for (const material of this.mesh.material) {
					material.dispose();
				}
			} else {
				this.mesh.material.dispose();
			}
		}
	};

	clearData = async () => {
		this.#testCylinderInstance?.dispose();
		this.#testCylinderInstance = null;

		this.#collisionDetector.dispose();

		if (this.mesh) {
			this.mesh.geometry.dispose();
			this.mesh = undefined;
		}

		this.boundingBox = undefined;
		this.center = undefined;
		this.size = undefined;
		this.loadedStlFromIndexedDb = false;
		this.currentType = undefined;

		await this.#transformController.resetDatabase();
		this.#transformController.clear();
		this.#eventManager.toggleInputs(true);
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
		this.#transformController.autoAlign(() => {
			this.computeBoundingBox();
			return { boundingBox: this.boundingBox, center: this.center };
		});
	};

	// ─────────────────────────────────────────────────────────────────────────────
	// Collision Detection
	// ─────────────────────────────────────────────────────────────────────────────

	#checkCollisionAndUpdateUI = async () => {
		const state = await this.#collisionDetector.checkCollision(
			this.mesh,
			this.currentType,
		);
		this.#updateCollisionUI(state);
	};

	isIntersectingWithSocketCup = async () => {
		await this.#checkCollisionAndUpdateUI();
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
		this.mesh.userData = { isPrintObject: true };
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

		await this.#checkCollisionAndUpdateUI();
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
		this.mesh.userData = { isPrintObject: true };
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

		this.offsetYPosition = this.size.y / 2 - this.lockDepth;

		// Set up the transform controller with the mesh
		this.#transformController.setMesh({
			mesh: this.mesh,
			lockDepth: this.lockDepth,
			offsetYPosition: this.offsetYPosition,
		});

		await this.#transformController.restoreFromDatabase(
			this.loadedStlFromIndexedDb,
		);

		this.callback({
			size: { x: this.size.x, y: this.size.y, z: this.size.z },
		});

		await this.#checkCollisionAndUpdateUI();

		this.#eventManager.toggleInputs(false);
		loadingScreen.style.display = "none";
	};

	#onStlFileChange = async (_event: Event) => {
		const file = stlFileInput?.files?.[0];

		switch (this.currentType) {
			case PrintObjectType.Socket:
				if (!file) return;
				await this.#handleSocket(file);
				break;
			case PrintObjectType.TestCylinder:
				await this.#handleTestCylinder();
				break;
		}

		await this.#checkCollisionAndUpdateUI();
	};

	// ─────────────────────────────────────────────────────────────────────────────
	// Transformation Methods (delegated to controller)
	// ─────────────────────────────────────────────────────────────────────────────

	handleRotationChange = async (axis: TransformAxis, amount: number) => {
		await this.#transformController.handleRotation(axis, amount, () => {
			this.computeBoundingBox();
			return { boundingBox: this.boundingBox, center: this.center };
		});
	};

	coronalRotate90 = () => this.handleRotationChange("x", QUARTER_TURN);
	sagittalRotate90 = () => this.handleRotationChange("z", QUARTER_TURN);
	transversalRotater90 = () => this.handleRotationChange("y", QUARTER_TURN);

	handleTranslationChange = async (axis: TransformAxis, evt: Event) => {
		await this.#transformController.handleTranslation(axis, evt);
	};

	horizontalChange = (evt: Event) => this.handleTranslationChange("x", evt);
	verticalChange = (evt: Event) => this.handleTranslationChange("y", evt);
	depthChange = (evt: Event) => this.handleTranslationChange("z", evt);

	getTransitionInstance(): CupToSocketTransition | null {
		return this.#collisionDetector.getTransitionInstance() as CupToSocketTransition | null;
	}

	/**
	 * Test helper to set up the transform controller with the current mesh.
	 * This simulates what #handleSocket does internally.
	 * @internal Only for testing purposes
	 */
	_testSetupTransformController(): void {
		if (!this.mesh) return;
		this.#transformController.setMesh({
			mesh: this.mesh,
			lockDepth: this.lockDepth,
			offsetYPosition: this.offsetYPosition,
		});
	}
}

import { abs, pi, round } from "mathjs";
import type { Camera } from "three";
import {
	type BufferGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";
import { STLExporter } from "three/examples/jsm/Addons.js";
import { STLLoader as ThreeSTLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { acceleratedRaycast, MeshBVH } from "three-mesh-bvh";
import { ensureUV } from "@/3d/ensureUV";
import {
	filterGeometryByVertexIndices,
	toTriangleIndexSet,
} from "@/3d/filterGeometryByVertexIndices";
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
import { computeSelectedTriangles } from "@/utils/computeSelectedTriangles";
import {
	activeFileName,
	addTestCylinderButton,
	addTestStlButton,
	coronalRotater,
	depthTranslate,
	horizontalTranslate,
	loadingScreen,
	sagittalRotate,
	stlFileInput,
	transversalRotater,
	verticalTranslate,
} from "@/utils/htmlElements";
import { fetchStlFile, setStlFileInputAndDispatch } from "@/utils/printObject";
import { AppObject } from "./AppObject";
import type { BoxSelection, LassoSelection } from "./Selection";
import { TestCylinder } from "./TestCylinder";

// TODO: Implement a selection tool to select parts of the mesh for printing a cut
// https://github.com/gkjohnson/three-mesh-bvh/blob/master/example/selection.js

type Callback = (params: { size: { x: number; y: number; z: number } }) => void;

export class PrintObject extends AppObject {
	callback: Callback;
	lockDepth: number | null = null;
	loadedStlFromIndexedDb = false;
	offsetYPosition = 0;
	currentType: PrintObjectType = undefined;
	originalGeometry: BufferGeometry | null = null;
	excludedVertexIndices: number[] = [];

	constructor({ callback }: { callback: Callback }) {
		super();

		this.callback = callback;

		if (!stlFileInput) {
			throw new Error("STL File Input not found");
		}

		getAllFiles().then((files) => {
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
		});

		addTestStlButton?.addEventListener("click", async () => {
			await this.clearData();
			this.currentType = PrintObjectType.Socket;
			await fetchStlFile("test_stl_file.stl")();
		});
		addTestCylinderButton?.addEventListener("click", async () => {
			await this.clearData();
			this.currentType = PrintObjectType.TestCylinder;
			await this.#handleTestCylinder();
		});

		stlFileInput?.addEventListener("change", async (evt) => {
			if (evt.isTrusted) {
				await this.clearData();
			}

			this.currentType = evt.isTrusted
				? PrintObjectType.Socket
				: this.currentType;

			this.#onStlFileChange(evt);
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

	getShrinkScale = async (mesh: Mesh) => {
		const shrinkFactor = await getActiveMaterialProfileShrinkFactor();
		const shrinkScale = 1 / (1 - shrinkFactor / 100);

		mesh.scale.set(shrinkScale, shrinkScale, shrinkScale);

		return shrinkScale;
	};

	applyNozzleSizeOffset = async (printObjectMesh: Mesh) => {
		const nozzleSize = await getNozzleSize();
		this.mesh = await applyOffset(printObjectMesh, nozzleSize / 2);
	};

	useCallback = ({ x, y, z }: { x: number; y: number; z: number }) => {
		this.callback({
			size: {
				x,
				y,
				z,
			},
		});
	};

	#exportTestCylinder = async (mesh: Mesh) => {
		const stlExporter = new STLExporter();
		const stlString = stlExporter.parse(mesh);
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
		const testCylinder = await TestCylinder.create();

		await this.getShrinkScale(testCylinder.mesh);
		await this.applyNozzleSizeOffset(testCylinder.mesh);

		this.mesh.name = "test_cylinder";
		activeFileName.textContent = "test_cylinder";

		this.#exportTestCylinder(this.mesh);

		this.computeBoundingBox();

		this.mesh.position.set(0, this.size.y / 2, 0);

		this.useCallback({
			x: testCylinder.size.x,
			y: testCylinder.size.y,
			z: testCylinder.size.z,
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
			wireframe: false,
		});
		const mesh = new Mesh(rawGeometry, material);
		const bvh = new MeshBVH(mesh.geometry);

		await this.getShrinkScale(mesh);
		await this.applyNozzleSizeOffset(mesh);

		this.mesh.raycast = acceleratedRaycast;
		this.mesh.geometry.boundsTree = bvh;
		this.mesh.name = file.name;
		this.mesh.userData = { isSocket: true };
		this.computeBoundingBox();
		this.lockDepth = await getLockDepth();

		activeFileName.textContent = file.name;

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

		this.useCallback({
			x: this.size.x,
			y: this.size.y,
			z: this.size.z,
		});

		this.toggleInput(false);
	};

	/**
	 * Apply a cut line using a selection tool. Selected triangles are removed from the mesh
	 * so they will not be included in downstream print generation.
	 * Pass in the active camera and the selection tool containing normalized screen points.
	 */
	applyCutLine = async (
		selectionTool: LassoSelection | BoxSelection,
		camera: Camera,
		params: {
			selectionMode?: "intersection" | "centroid" | "centroid-visible";
			useBoundsTree?: boolean;
			selectWholeModel?: boolean;
		} = {},
	) => {
		if (!this.mesh) return;
		// Preserve the original geometry on first cut for potential reset
		if (!this.originalGeometry) {
			this.originalGeometry = this.mesh.geometry.clone();
		}

		const selectionParams = {
			selectionMode: params.selectionMode || "intersection",
			useBoundsTree: params.useBoundsTree ?? true,
			selectWholeModel: params.selectWholeModel ?? false,
		};

		// Compute selected vertex indices (flat list of triplets)
		const selected = computeSelectedTriangles(
			this.mesh,
			camera,
			selectionTool,
			selectionParams,
		);

		if (!selected.length) return; // nothing selected

		// Merge with any existing cuts (store unique vertex indices)
		this.excludedVertexIndices.push(...selected);
		const removalSet = toTriangleIndexSet(this.excludedVertexIndices);

		// Filter geometry
		const newGeom = filterGeometryByVertexIndices(
			this.mesh.geometry,
			removalSet,
		);
		this.mesh.geometry.dispose();
		this.mesh.geometry = newGeom;
		this.mesh.geometry.boundsTree = new MeshBVH(this.mesh.geometry);
		this.computeBoundingBox();

		// Re-align after geometry change
		this.autoAlignMesh();

		// Update size callback after cut
		this.useCallback({ x: this.size.x, y: this.size.y, z: this.size.z });
	};

	/** Restore the geometry and clear all cuts. */
	resetCut = () => {
		if (!this.originalGeometry || !this.mesh) return;
		this.mesh.geometry.dispose();
		this.mesh.geometry = this.originalGeometry.clone();
		this.mesh.geometry.boundsTree = new MeshBVH(this.mesh.geometry);
		this.excludedVertexIndices = [];
		this.computeBoundingBox();
		this.autoAlignMesh();
		this.useCallback({ x: this.size.x, y: this.size.y, z: this.size.z });
	};

	#onStlFileChange = async (event: Event) => {
		const { target: inputFiles } = event;
		const file = (inputFiles as HTMLInputElement).files?.[0];

		switch (this.currentType) {
			case PrintObjectType.Socket:
				await this.#handleSocket(file);
				break;
			case PrintObjectType.TestCylinder:
				await this.#handleTestCylinder();
				break;
		}
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
		return new Promise((resolve, _reject) => {
			const reader = new FileReader();

			reader.onload = async (e) => {
				const buffer = e.target?.result as ArrayBuffer;
				const loader = new ThreeSTLLoader();
				const geometry = loader.parse(buffer);
				resolve(geometry);
			};

			reader.readAsArrayBuffer(file);
		});
	};

	autoAlignMesh = () => {
		this.computeBoundingBox();
		const minY = this.boundingBox.min.y;

		this.mesh.position.x -= this.center.x;
		this.mesh.position.z -= this.center.z;

		if (minY < 0) {
			this.mesh.position.y += abs(minY) - this.lockDepth;
		}
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
	};

	coronalRotate90 = () => this.handleRotationChange("x", pi / 2);
	sagittalRotate90 = () => this.handleRotationChange("z", pi / 2);
	transversalRotater90 = () => this.handleRotationChange("y", pi / 2);

	handleTranslationChange = async (axis: "x" | "y" | "z", evt: Event) => {
		const targetValue = (evt.target as HTMLInputElement).value;
		const numVal = Number.parseInt(targetValue, 10);

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
	};

	horizontalChange = (evt: Event) => this.handleTranslationChange("x", evt);
	verticalChange = (evt: Event) => this.handleTranslationChange("y", evt);
	depthChange = (evt: Event) => this.handleTranslationChange("z", evt);
}

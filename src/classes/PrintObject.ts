import { abs, pi, round } from "mathjs";
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
import { applyOffset } from "@/3d/generateOffsetWithNormal";
import {
	getLockDepth,
	getRotateValues,
	getTranslateValues,
	setIsTestSTLCylinder,
	updateRotateValues,
	updateTranslateValues,
} from "@/db/appSettingsDbActions";
import { deleteAllFiles, getAllFiles, setFileByName } from "@/db/file";
import { getNozzleSize } from "@/db/formValuesDbActions";
import { getActiveMaterialProfileShrinkFactor } from "@/db/materialProfilesDbActions";
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
import { AppObject } from "./AppObject";
import { TestCylinder } from "./TestCylinder";

type Callback = (params: { size: { x: number; y: number; z: number } }) => void;

type PrintObjectProps = { callback: Callback };

export class PrintObject extends AppObject {
	adjustmentHeightForCup = 0;
	callback: Callback;
	lockDepth: number | null = null;
	loadedStlFromIndexedDb = false;
	offsetYPosition = 0;

	constructor({ callback }: PrintObjectProps) {
		super();

		this.callback = callback;

		if (!stlFileInput) {
			throw new Error("STL File Input not found");
		}

		const setStlFileInputAndDispatch = (file: File) => {
			const dataTransfer = new DataTransfer();
			dataTransfer.items.add(file);
			stlFileInput.files = dataTransfer.files;
			const changeEvent = new Event("change", { bubbles: true });
			stlFileInput.dispatchEvent(changeEvent);
		};

		getAllFiles().then((files) => {
			if (files.length === 1) {
				const { file, name } = files[0];
				const stlFile = new File([file], name, {
					type: "model/stl",
				});
				this.loadedStlFromIndexedDb = true;
				setStlFileInputAndDispatch(stlFile);
			} else {
				this.loadedStlFromIndexedDb = false;
				console.warn("No files found in the database.");
			}
		});

		const fetchStlFile = (name: string) => async () => {
			const response = await fetch(name);
			const arrayBuffer = await response.arrayBuffer();
			const file = new File([arrayBuffer], name, {
				type: "model/stl",
			});

			setStlFileInputAndDispatch(file);
		};

		addTestStlButton?.addEventListener("click", async () => {
			await this.clearData();
			await fetchStlFile("test_stl_file.stl")();
		});

		addTestCylinderButton?.addEventListener("click", async () => {
			const nozzleSize = await getNozzleSize();
			const shrinkFactor = await getActiveMaterialProfileShrinkFactor();
			const shrinkScale = 1 / (1 - shrinkFactor / 100);

			await this.clearData();
			await setIsTestSTLCylinder(true);

			const testCylinder = await TestCylinder.create();

			this.mesh = await applyOffset(testCylinder.mesh, nozzleSize / 2);
			this.mesh.name = "test_cylinder";
			activeFileName.textContent = "test_cylinder";

			// const stlExporter = new STLExporter();
			// const stlString = stlExporter.parse(testCylinder.mesh);
			// const stlArrayBuffer = new TextEncoder().encode(stlString).buffer;

			// const cylinderFile = new File([stlArrayBuffer], "test_cylinder.stl", {
			// 	type: "model/stl",
			// });
			// await deleteAllFiles();
			// await setFileByName("test_cylinder.stl", {
			// 	name: "test_cylinder.stl",
			// 	file: cylinderFile,
			// });

			this.computeBoundingBox();

			this.mesh.position.set(0, this.size.y / 2, 0);
			this.mesh.scale.set(shrinkScale, shrinkScale, shrinkScale);

			this.callback({
				size: {
					x: testCylinder.size.x,
					y: testCylinder.size.y,
					z: testCylinder.size.z,
				},
			});
		});
		stlFileInput?.addEventListener("change", this.#onStlFileChange);
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

	#onStlFileChange = async (event: Event) => {
		const { target: inputFiles } = event;
		const file = (inputFiles as HTMLInputElement).files?.[0];

		const isUserTriggered = event.isTrusted;

		if (isUserTriggered) {
			await setIsTestSTLCylinder(false);
		}

		if (file) {
			await deleteAllFiles();
			await setFileByName(file.name, {
				name: file.name,
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
			const nozzleSize = await getNozzleSize();
			const shrinkFactor = await getActiveMaterialProfileShrinkFactor();
			const shrinkScale = 1 / (1 - shrinkFactor / 100);

			this.mesh = await applyOffset(mesh, nozzleSize / 2);
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

			this.mesh.scale.set(shrinkScale, shrinkScale, shrinkScale);

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
					y: this.size.y,
					x: this.size.x,
					z: this.size.z,
				},
			});

			this.toggleInput(false);
		}
	};

	clearData = async () => {
		if (this.mesh) {
			this.mesh.geometry.dispose();
			this.mesh = undefined;
		}

		stlFileInput.value = "";
		this.boundingBox = undefined;
		this.center = undefined;
		this.size = undefined;
		this.loadedStlFromIndexedDb = false;

		await setIsTestSTLCylinder(false);
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

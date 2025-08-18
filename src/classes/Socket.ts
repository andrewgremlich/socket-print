import { abs, max, pi } from "mathjs";
import {
	type BufferGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";
import { STLLoader as ThreeSTLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { acceleratedRaycast, MeshBVH } from "three-mesh-bvh";

import { ensureUV } from "@/3d/ensureUV";
import { deleteAllFiles, getAllFiles, setFileByName } from "@/db/file";
import {
	getLockDepth,
	getRotateValues,
	getTranslateValues,
	updateRotateValues,
	updateTranslateValues,
} from "@/db/keyValueSettings";
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

type SocketCallback = (params: { maxDimension: number }) => void;

type SocketProps = { socketCallback: SocketCallback };

export class Socket extends AppObject {
	adjustmentHeightForCup = 0;
	socketCallback: SocketCallback;
	lockDepth: number | null = null;
	loadedStlFromIndexedDb = false;
	offsetYPosition = 0;
	isTestSTLCylinder = false;

	constructor({ socketCallback }: SocketProps) {
		super();

		this.socketCallback = socketCallback;

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
			await this.clearData();
			this.isTestSTLCylinder = true;
			await fetchStlFile("test_cylinder.stl")();
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

	#onStlFileChange = async ({ target: inputFiles }: Event) => {
		const file = (inputFiles as HTMLInputElement).files?.[0];

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

			const material = new MeshStandardMaterial({
				color: 0xffffff,
				side: DoubleSide,
			});
			const mesh = new Mesh(rawGeometry, material);
			const bvh = new MeshBVH(mesh.geometry);

			this.mesh = mesh;
			this.mesh.raycast = acceleratedRaycast;

			this.mesh.geometry.boundsTree = bvh;

			this.mesh.name = file.name;
			this.mesh.userData = { isSocket: true };
			this.computeBoundingBox();
			activeFileName.textContent = file.name;
			this.lockDepth = await getLockDepth();

			// Set position and update matrix
			this.mesh.geometry.translate(
				-this.center.x,
				-this.center.y,
				-this.center.z,
			);

			// Load and apply stored translate and rotate values
			const translateValues = await getTranslateValues();
			const rotateValues = await getRotateValues();

			this.offsetYPosition = !this.isTestSTLCylinder
				? this.size.y / 2 - this.lockDepth
				: this.size.y / 2;

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

			this.mesh.geometry.computeVertexNormals();

			horizontalTranslate.value = (-this.mesh.position.x).toString();
			verticalTranslate.value = (
				this.mesh.position.y -
				(!this.isTestSTLCylinder ? this.offsetYPosition : this.mesh.position.y)
			).toString();
			depthTranslate.value = (-this.mesh.position.z).toString();

			this.socketCallback({
				maxDimension: max(this.size.x, this.size.y, this.size.z),
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
		this.isTestSTLCylinder = false;

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

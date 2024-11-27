import type GUI from "lil-gui";
import {
	Box3,
	type BufferGeometry,
	Mesh,
	MeshStandardMaterial,
	Vector3,
} from "three";
import { STLLoader as ThreeSTLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import { ensureUV } from "@/utils/ensureUV";
import { loadingScreen, stlFileInput } from "@/utils/htmlElements";
import { AppObject, type AppObjectFunctions } from "./AppObject";

type StlLoadedCallback = (params: {
	mesh: Mesh;
	maxDimension: number;
	center: Vector3;
}) => void;

export class STLLoader extends AppObject implements AppObjectFunctions {
	#rotationFolder!: GUI;
	#positionFolder!: GUI;

	layerHeight = 0.2; // TODO: let's stick with 1mm for now. customizable later? // look for centroid 40 mm above z0
	extrusionWidth = 0.4; //TODO: is this nozzle offset?
	stlLoadedCallback: StlLoadedCallback;
	boundingBox?: Box3;

	constructor({
		stlLoadedCallback,
	}: {
		stlLoadedCallback: StlLoadedCallback;
	}) {
		super();

		this.stlLoadedCallback = stlLoadedCallback;

		if (import.meta.env.MODE === "development") {
			this.#rotationFolder = this.gui.addFolder("STL Rotation");
			this.#positionFolder = this.gui.addFolder("STL Position");
		}

		if (!stlFileInput) {
			throw new Error("STL File Input not found");
		}

		stlFileInput?.addEventListener("change", this.#onStlFileChange);
	}

	updateMatrixWorld = () => {
		if (this.mesh) {
			this.mesh.updateMatrixWorld(true);

			this.mesh.geometry.applyMatrix4(this.mesh.matrixWorld);

			this.mesh.rotation.set(0, 0, 0);
			this.mesh.position.set(0, 0, 0);

			this.mesh.geometry.computeVertexNormals();
			this.mesh.geometry.computeBoundingBox();
		}
	};

	#onStlFileChange = async ({ target: inputFiles }: Event) => {
		const file = (inputFiles as HTMLInputElement).files?.[0];

		if (!loadingScreen) {
			throw new Error("Loading screen not found");
		}

		if (!stlFileInput) {
			throw new Error("STL File Input not found");
		}

		if (file) {
			loadingScreen.style.display = "flex";

			const geometry = await this.#readSTLFile(file);

			geometry.rotateX(-Math.PI * 0.5);

			// const closeBottom = closeUpBottomLimbGeometry(geometry);
			// const closeTop = closeUpTopLimbGeometry(geometry);

			// const mergedGeometry = BufferGeometryUtils.mergeGeometries([
			// 	geometry,
			// 	closeBottom,
			// 	closeTop,
			// ]);

			// mergedGeometry.computeBoundingBox();
			// mergedGeometry.computeVertexNormals();
			ensureUV(geometry);

			const material = new MeshStandardMaterial({
				color: 0xffffff,
				wireframe: true,
			});
			const mesh = new Mesh(geometry, material);

			const boundingBox = new Box3().setFromObject(mesh);
			const size = boundingBox.getSize(new Vector3());
			const maxDimension = Math.max(size.x, size.y, size.z);

			this.mesh = mesh;
			this.mesh.position.set(0, size.y / 2, 0);
			this.boundingBox = boundingBox;

			this.updateMatrixWorld();

			this.stlLoadedCallback({
				mesh,
				maxDimension,
				center: boundingBox.getCenter(new Vector3()),
			});

			stlFileInput.disabled = true;

			if (import.meta.env.MODE === "development") {
				this.addGui();
			}
		}
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

	addGui = () => {
		if (!this.mesh) {
			return;
		}

		this.#rotationFolder
			.add(this.mesh.rotation, "x", -Math.PI * 2, Math.PI * 2, Math.PI / 6)
			.name("X");
		this.#rotationFolder
			.add(this.mesh.rotation, "y", -Math.PI * 2, Math.PI * 2, Math.PI / 6)
			.name("Y");
		this.#rotationFolder
			.add(this.mesh.rotation, "z", -Math.PI * 2, Math.PI * 2, Math.PI / 6)
			.name("Z");

		this.#positionFolder.add(this.mesh.position, "x", -500, 500, 10).name("X");
		this.#positionFolder.add(this.mesh.position, "y", -500, 500, 10).name("Y");
		this.#positionFolder.add(this.mesh.position, "z", -500, 500, 10).name("Z");
	};

	removeGui = () => {
		this.#positionFolder.destroy();
		this.#rotationFolder.destroy();
	};
}

import {
	Box3,
	type BufferGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
	Vector3,
} from "three";
import { STLLoader as ThreeSTLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import { ensureUV } from "@/utils/ensureUV";
import {
	coronalRotate,
	loadingScreen,
	sagittalRotate,
	stlFileInput,
	transversalRotate,
	xPosition,
	yPosition,
	zPosition,
} from "@/utils/htmlElements";
import { AppObject } from "./AppObject";

type StlLoadedCallback = (params: {
	mesh: Mesh;
	maxDimension: number;
	center: Vector3;
}) => void;

export class STLLoader extends AppObject {
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

		if (!stlFileInput) {
			throw new Error("STL File Input not found");
		}

		stlFileInput?.addEventListener("change", this.#onStlFileChange);
		transversalRotate?.addEventListener("click", this.transverseRotate90);
		sagittalRotate?.addEventListener("click", this.sagittalRotate90);
		coronalRotate?.addEventListener("click", this.coronalRotate90);
		xPosition?.addEventListener("input", ({ target }) => {
			if (!this.mesh) {
				return;
			}

			this.changeXPosition(
				Number.parseFloat((target as HTMLInputElement).value),
			);
		});
		yPosition?.addEventListener("input", ({ target }) => {
			if (!this.mesh) {
				return;
			}

			this.changeYPosition(
				Number.parseFloat((target as HTMLInputElement).value),
			);
		});
		zPosition?.addEventListener("input", ({ target }) => {
			if (!this.mesh) {
				return;
			}

			this.changeZPosition(
				Number.parseFloat((target as HTMLInputElement).value),
			);
		});
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

			geometry.computeBoundingBox();
			geometry.computeVertexNormals();
			ensureUV(geometry);

			const material = new MeshStandardMaterial({
				color: 0xffffff,
				side: DoubleSide,
			});
			const mesh = new Mesh(geometry, material);

			const boundingBox = new Box3().setFromObject(mesh);
			const size = boundingBox.getSize(new Vector3());
			const maxDimension = Math.max(size.x, size.y, size.z);

			this.mesh = mesh;
			this.boundingBox = boundingBox;
			this.mesh.position.set(0, size.y / 2, 0);

			this.stlLoadedCallback({
				mesh,
				maxDimension,
				center: boundingBox.getCenter(new Vector3()),
			});

			transversalRotate.disabled = false;
			sagittalRotate.disabled = false;
			coronalRotate.disabled = false;
			xPosition.disabled = false;
			yPosition.disabled = false;
			zPosition.disabled = false;
			stlFileInput.disabled = true;
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

	transverseRotate90 = () => {
		if (!this.mesh) {
			return;
		}

		this.mesh.rotateX(Math.PI / 2);
	};

	sagittalRotate90 = () => {
		if (!this.mesh) {
			return;
		}

		this.mesh.rotateZ(Math.PI / 2);
	};

	coronalRotate90 = () => {
		if (!this.mesh) {
			return;
		}

		this.mesh.rotateY(Math.PI / 2);
	};

	changeYPosition = (value: number) => {
		if (!this.mesh) {
			return;
		}

		this.mesh.position.setY(value);
	};

	changeXPosition = (value: number) => {
		if (!this.mesh) {
			return;
		}

		this.mesh.position.setX(value);
	};

	changeZPosition = (value: number) => {
		if (!this.mesh) {
			return;
		}

		this.mesh.position.setZ(value);
	};
}

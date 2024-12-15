import {
	Box3,
	BoxHelper,
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
} from "@/utils/htmlElements";
import { AppObject } from "./AppObject";

type SocketCallback = (params: {
	mesh: Mesh;
	maxDimension: number;
	center: Vector3;
	boxHelper: BoxHelper;
}) => void;

export class Socket extends AppObject {
	adjustmentHeightForCup = 40;
	socketCallback: SocketCallback;
	boundingBox?: Box3;
	center?: Vector3;
	size?: Vector3;

	boxHelper?: BoxHelper;

	constructor({
		socketCallback,
	}: {
		socketCallback: SocketCallback;
	}) {
		super();

		this.socketCallback = socketCallback;

		if (!stlFileInput) {
			throw new Error("STL File Input not found");
		}

		stlFileInput?.addEventListener("change", this.#onStlFileChange);
		transversalRotate?.addEventListener("click", this.transverseRotate90);
		sagittalRotate?.addEventListener("click", this.sagittalRotate90);
		coronalRotate?.addEventListener("click", this.coronalRotate90);
		// autoAlignSocket?.addEventListener("click", this.autoAlignSocket);
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

			// convert Z - Y
			geometry.rotateX(-Math.PI / 2);
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
			this.mesh.position.set(0, size.y / 2 + this.adjustmentHeightForCup, 0);
			this.center = boundingBox.getCenter(new Vector3());
			this.size = size;

			const boxHelper = new BoxHelper(mesh, 0xffff00);
			this.boxHelper = boxHelper;

			this.updateMatrixWorld();

			this.socketCallback({
				mesh,
				maxDimension,
				center: this.center,
				boxHelper,
			});

			transversalRotate.disabled = false;
			sagittalRotate.disabled = false;
			coronalRotate.disabled = false;
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

	autoAlignMesh = () => {
		if (!this.mesh) {
			return;
		}

		const boundingBox = new Box3().setFromObject(this.mesh);
		const size = boundingBox.getSize(new Vector3());
		const center = boundingBox.getCenter(new Vector3());
		const minY = boundingBox.min.y;

		this.mesh.position.x -= center.x;
		this.mesh.position.z -= center.z;

		if (minY < 0) {
			this.mesh.position.y += Math.abs(minY) + this.adjustmentHeightForCup;
		}

		this.size = size;
		this.boundingBox = boundingBox;
		this.center = center;

		this.updateMatrixWorld();
		this.boxHelper?.update();
	};

	transverseRotate90 = () => {
		if (!this.mesh) {
			return;
		}

		this.mesh.rotateX(Math.PI / 2);
		this.autoAlignMesh();
	};

	sagittalRotate90 = () => {
		if (!this.mesh) {
			return;
		}

		this.mesh.rotateZ(Math.PI / 2);
		this.autoAlignMesh();
	};

	coronalRotate90 = () => {
		if (!this.mesh) {
			return;
		}

		this.mesh.rotateY(Math.PI / 2);
		this.autoAlignMesh();
	};
}

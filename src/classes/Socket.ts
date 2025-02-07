import {
	Box3,
	type BufferGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
	Vector3,
} from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";
import { STLLoader as ThreeSTLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import { ensureUV } from "@/utils/ensureUV";
import {
	coronalRotate,
	depthTranslate,
	horizontalTranslate,
	loadingScreen,
	mergeMeshes,
	sagittalRotate,
	stlFileInput,
	transversalRotate,
	verticalTranslate,
} from "@/utils/htmlElements";
import { removeDuplicateVertices } from "@/utils/removeDups";
import { AppObject } from "./AppObject";

type SocketCallback = (params: {
	mesh: Mesh;
	maxDimension: number;
	boundingBox: Box3;
}) => void;

export class Socket extends AppObject {
	adjustmentHeightForCup = 10;
	socketCallback: SocketCallback;
	boundingBox?: Box3;
	center?: Vector3;
	size?: Vector3;

	constructor({ socketCallback }: { socketCallback: SocketCallback }) {
		super();

		this.socketCallback = socketCallback;

		if (!stlFileInput) {
			throw new Error("STL File Input not found");
		}

		stlFileInput?.addEventListener("change", this.#onStlFileChange);
		transversalRotate?.addEventListener("click", this.transverseRotate90);
		sagittalRotate?.addEventListener("click", this.sagittalRotate90);
		coronalRotate?.addEventListener("click", this.coronalRotate90);
		verticalTranslate?.addEventListener("input", this.verticalChange);
		horizontalTranslate?.addEventListener("input", this.horizontalChange);
		depthTranslate?.addEventListener("input", this.depthChange);
	}

	clearData = () => {
		if (this.mesh) {
			this.mesh.geometry.dispose();
			this.mesh = undefined;
		}

		stlFileInput.value = "";
		this.boundingBox = undefined;
		this.center = undefined;
		this.size = undefined;

		this.toggleInput(true);
	};

	updateMatrixWorld = () => {
		if (this.mesh) {
			this.mesh.updateMatrixWorld(true);

			this.mesh.geometry.applyMatrix4(this.mesh.matrixWorld);

			this.mesh.rotation.set(0, 0, 0);
			this.mesh.position.set(0, 0, 0);

			this.mesh.geometry.computeVertexNormals();
			this.mesh.geometry.computeBoundingBox();
			this.mesh.geometry.computeBoundingSphere();
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

			const rawGeometry = await this.#readSTLFile(file);
			const removeDups = removeDuplicateVertices(rawGeometry);
			const geometry = BufferGeometryUtils.mergeVertices(removeDups);

			// convert Z - Y
			geometry.rotateX(-Math.PI / 2);
			ensureUV(geometry);

			const material = new MeshStandardMaterial({
				color: 0xffffff,
				side: DoubleSide,
			});
			const mesh = new Mesh(geometry, material);

			this.mesh = mesh;
			this.mesh.name = file.name;
			this.computeBoundingBox();
			this.mesh.position.set(
				0,
				this.size.y / 2 + this.adjustmentHeightForCup,
				0,
			);

			const { activeMaterialProfile, nozzleSize } = window.provelPrintStore;
			const currentWidth = this.size.x;
			const nozzleScale = (Number(nozzleSize) + currentWidth) / currentWidth;
			const shrinkScale =
				window.materialProfiles[activeMaterialProfile].shrinkFactor;
			const scaleAdjustment = nozzleScale + shrinkScale / 100;

			this.mesh.scale.set(scaleAdjustment, 1, scaleAdjustment);

			this.updateMatrixWorld();
			this.socketCallback({
				mesh,
				maxDimension: Math.max(this.size.x, this.size.y, this.size.z),
				boundingBox: this.boundingBox,
			});

			this.toggleInput(false);
		}
	};

	toggleInput = (isDisabled: boolean) => {
		transversalRotate.disabled = isDisabled;
		sagittalRotate.disabled = isDisabled;
		coronalRotate.disabled = isDisabled;
		mergeMeshes.disabled = isDisabled;
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

	computeBoundingBox = () => {
		if (!this.mesh) {
			throw new Error("Mesh not found");
		}

		const boundingBox = new Box3().setFromObject(this.mesh);

		this.boundingBox = boundingBox;
		this.size = boundingBox.getSize(new Vector3());
		this.center = boundingBox.getCenter(new Vector3());
	};

	autoAlignMesh = () => {
		this.computeBoundingBox();
		const minY = this.boundingBox.min.y;

		this.mesh.position.x -= this.center.x;
		this.mesh.position.z -= this.center.z;

		if (minY < 0) {
			this.mesh.position.y += Math.abs(minY) + this.adjustmentHeightForCup;
		}

		this.updateMatrixWorld();
	};

	transverseRotate90 = () => {
		this.mesh.rotateX(Math.PI / 2);
		this.autoAlignMesh();
	};

	sagittalRotate90 = () => {
		this.mesh.rotateZ(Math.PI / 2);
		this.autoAlignMesh();
	};

	coronalRotate90 = () => {
		this.mesh.rotateY(Math.PI / 2);
		this.autoAlignMesh();
	};

	horizontalChange = (evt: Event) => {
		const targetValue = (evt.target as HTMLInputElement).value;
		this.mesh.position.x = Number.parseInt(targetValue);
	};

	verticalChange = (evt: Event) => {
		const targetValue = (evt.target as HTMLInputElement).value;
		this.mesh.position.y = Number.parseInt(targetValue);
	};

	depthChange = (evt: Event) => {
		const targetValue = (evt.target as HTMLInputElement).value;
		this.mesh.position.z = Number.parseInt(targetValue);
	};
}

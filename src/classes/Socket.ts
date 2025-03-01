import { abs, max, pi } from "mathjs";
import {
	type Box3,
	type BufferGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";
import { STLLoader as ThreeSTLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import { ensureUV } from "@/3d/ensureUV";
import { removeDuplicateVertices } from "@/3d/removeDups";
import { getLockDepth } from "@/db/appSettings";
import {
	coronalRotater,
	depthTranslate,
	horizontalTranslate,
	loadingScreen,
	mergeMeshes,
	sagittalRotate,
	stlFileInput,
	transversalRotater,
	verticalTranslate,
} from "@/utils/htmlElements";

import { AppObject } from "./AppObject";

type SocketCallback = (params: {
	mesh: Mesh;
	maxDimension: number;
	boundingBox: Box3;
}) => void;

export class Socket extends AppObject {
	adjustmentHeightForCup = 0;
	socketCallback: SocketCallback;

	constructor({ socketCallback }: { socketCallback: SocketCallback }) {
		super();

		this.socketCallback = socketCallback;

		if (!stlFileInput) {
			throw new Error("STL File Input not found");
		}

		stlFileInput?.addEventListener("change", this.#onStlFileChange);
		coronalRotater?.addEventListener("click", this.transverseRotate90);
		sagittalRotate?.addEventListener("click", this.sagittalRotate90);
		transversalRotater?.addEventListener("click", this.transversalRotater90);
		verticalTranslate?.addEventListener("input", this.verticalChange);
		horizontalTranslate?.addEventListener("input", this.horizontalChange);
		depthTranslate?.addEventListener("input", this.depthChange);
	}

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
			geometry.rotateX(-pi / 2);
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
				this.size.y / 2 + this.adjustmentHeightForCup - (await getLockDepth()),
				0,
			);

			this.mesh.matrixWorldAutoUpdate = true;

			this.socketCallback({
				mesh,
				maxDimension: max(this.size.x, this.size.y, this.size.z),
				boundingBox: this.boundingBox,
			});

			this.toggleInput(false);
		}
	};

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

	toggleInput = (isDisabled: boolean) => {
		coronalRotater.disabled = isDisabled;
		sagittalRotate.disabled = isDisabled;
		transversalRotater.disabled = isDisabled;
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

	autoAlignMesh = () => {
		this.computeBoundingBox();
		const minY = this.boundingBox.min.y;

		this.mesh.position.x -= this.center.x;
		this.mesh.position.z -= this.center.z;

		if (minY < 0) {
			this.mesh.position.y += abs(minY) + this.adjustmentHeightForCup;
		}
	};

	transverseRotate90 = () => {
		this.mesh.rotateX(pi / 2);
		this.autoAlignMesh();
	};

	sagittalRotate90 = () => {
		this.mesh.rotateZ(pi / 2);
		this.autoAlignMesh();
	};

	transversalRotater90 = () => {
		this.mesh.rotateY(pi / 2);
		this.autoAlignMesh();
	};

	horizontalChange = (evt: Event) => {
		const targetValue = (evt.target as HTMLInputElement).value;
		this.mesh.position.x = Number.parseInt(targetValue);
	};

	verticalChange = (evt: Event) => {
		const targetValue = (evt.target as HTMLInputElement).value;
		const numVal = Number.parseInt(targetValue);
		const floor = 80;
		const minY = abs(this.boundingBox.min.y) + this.adjustmentHeightForCup;

		if (minY + numVal < floor) {
			this.mesh.position.y = floor;
		} else {
			this.mesh.position.y = minY + numVal;
		}
	};

	depthChange = (evt: Event) => {
		const targetValue = (evt.target as HTMLInputElement).value;
		this.mesh.position.z = Number.parseInt(targetValue);
	};
}

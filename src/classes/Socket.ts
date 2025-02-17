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
import { getNozzleSize } from "@/db/appSettings";
import { getActiveMaterialProfileShrinkFactor } from "@/db/materialProfiles";
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

import { AppObject } from "./AppObject";

type SocketCallback = (params: {
	mesh: Mesh;
	maxDimension: number;
	boundingBox: Box3;
}) => void;

export class Socket extends AppObject {
	adjustmentHeightForCup = 10;
	socketCallback: SocketCallback;

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

			const nozzleSize = await getNozzleSize();
			const currentWidth = this.size.x;
			const nozzleScale = (Number(nozzleSize) + currentWidth) / currentWidth;
			const shrinkScale = await getActiveMaterialProfileShrinkFactor();
			const scaleAdjustment = nozzleScale + shrinkScale / 100;

			this.mesh.scale.set(scaleAdjustment, 1, scaleAdjustment);
			this.mesh.matrixWorldAutoUpdate = true;

			this.socketCallback({
				mesh,
				maxDimension: Math.max(this.size.x, this.size.y, this.size.z),
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

	autoAlignMesh = () => {
		this.computeBoundingBox();
		const minY = this.boundingBox.min.y;

		this.mesh.position.x -= this.center.x;
		this.mesh.position.z -= this.center.z;

		if (minY < 0) {
			this.mesh.position.y += Math.abs(minY) + this.adjustmentHeightForCup;
		}
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
		const numVal = Number.parseInt(targetValue);
		const floor = 80;
		const minY = Math.abs(this.boundingBox.min.y) + this.adjustmentHeightForCup;

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

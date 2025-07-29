import { abs, max, pi } from "mathjs";
import {
	type Box3,
	type BufferGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";
import { STLLoader as ThreeSTLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { acceleratedRaycast, MeshBVH } from "three-mesh-bvh";

import type { RawPoint } from "@/3d/blendHardEdges";
import { ensureUV } from "@/3d/ensureUV";
import { getLockDepth } from "@/db/keyValueSettings";
import {
	activeFileName,
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
import type { Ring } from "./Ring";

type SocketCallback = (params: { maxDimension: number }) => void;

type SocketProps = { socketCallback: SocketCallback };

export class Socket extends AppObject {
	adjustmentHeightForCup = 0;
	setPosition: RawPoint | null = null;
	socketCallback: SocketCallback;
	lockDepth: number | null = null;

	constructor({ socketCallback }: SocketProps) {
		super();

		this.socketCallback = socketCallback;

		if (!stlFileInput) {
			throw new Error("STL File Input not found");
		}

		addTestStlButton?.addEventListener("click", async () => {
			const response = await fetch("/test_stl_file.stl");
			const arrayBuffer = await response.arrayBuffer();
			const file = new File([arrayBuffer], "test_stl_file.stl", {
				type: "model/stl",
			});

			const dataTransfer = new DataTransfer();
			dataTransfer.items.add(file);
			stlFileInput.files = dataTransfer.files;

			const changeEvent = new Event("change", { bubbles: true });
			stlFileInput.dispatchEvent(changeEvent);
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

	hasIntersection = (ring: Ring): boolean => {
		return this.mesh.geometry.boundsTree.intersectsGeometry(
			this.mesh.geometry,
			ring.mesh.matrixWorld,
		);
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
			this.computeBoundingBox();
			activeFileName.textContent = file.name;
			this.lockDepth = await getLockDepth();

			// Set position and update matrix
			this.mesh.geometry.translate(
				-this.center.x,
				-this.center.y,
				-this.center.z,
			);
			this.mesh.position.set(0, this.size.y / 2 - this.lockDepth, 0);
			this.updateMatrixWorld();

			this.setPosition = {
				x: this.mesh.position.x,
				y: this.mesh.position.y,
				z: this.mesh.position.z,
			};

			this.socketCallback({
				maxDimension: max(this.size.x, this.size.y, this.size.z),
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

		this.updateMatrixWorld();

		this.setPosition = {
			x: this.mesh.position.x,
			y: this.mesh.position.y,
			z: this.mesh.position.z,
		};
	};

	coronalRotate90 = () => {
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
		const numVal = Number.parseInt(targetValue);

		this.mesh.position.x = this.setPosition.x - numVal;
	};

	verticalChange = (evt: Event) => {
		const targetValue = (evt.target as HTMLInputElement).value;
		console.log("verticalChange", targetValue);
		const numVal = Number.parseInt(targetValue);

		this.mesh.position.y = this.setPosition.y + numVal;
	};

	depthChange = (evt: Event) => {
		const targetValue = (evt.target as HTMLInputElement).value;
		const numVal = Number.parseInt(targetValue);

		this.mesh.position.z = this.setPosition.z - numVal;
	};
}

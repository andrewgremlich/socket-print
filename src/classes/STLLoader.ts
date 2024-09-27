import type GUI from "lil-gui";
import {
	Box3,
	BufferAttribute,
	type BufferGeometry,
	Mesh,
	MeshBasicMaterial,
	Vector3,
} from "three";
import { STLLoader as ThreeSTLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import { getGui } from "@/utils/gui";

const stlFileInputId = "stlFileInput";
const stlFileInputLabelId = "stlFileInputLabel";

type StlLoadedCallback = (params: {
	mesh: Mesh;
	maxSize: number;
	meshMergeCompatible: BufferGeometry;
}) => void;

export class STLLoader {
	#gui: GUI;

	layerHeight = 0.2;
	extrusionWidth = 0.4;
	geometry: BufferGeometry | null = null;
	mesh: Mesh | null = null;
	stlLoadedCallback: StlLoadedCallback;

	constructor({
		stlLoadedCallback,
	}: {
		stlLoadedCallback?: StlLoadedCallback;
	}) {
		this.stlLoadedCallback = stlLoadedCallback ?? (() => {});
		this.#gui = getGui();

		document.querySelector("body")?.appendChild(this.#createSTLInput());
	}

	#createSTLInput = (): HTMLLabelElement => {
		const input = document.createElement("input");
		const label = document.createElement("label");

		input.type = "file";
		input.accept = ".stl";
		input.id = stlFileInputId;

		label.htmlFor = stlFileInputId;
		label.textContent = "STL file";
		label.id = stlFileInputLabelId;

		input.addEventListener("change", this.#onStlFileChange);

		label.appendChild(input);

		return label;
	};

	#addGui = () => {
		const rotationFolder = this.#gui.addFolder("STL Rotation");
		const positionFolder = this.#gui.addFolder("STL Position");

		if (!this.mesh) {
			return;
		}

		rotationFolder
			.add(this.mesh.rotation, "x", -Math.PI * 2, Math.PI * 2, 0.1)
			.name("Rotation X");
		rotationFolder
			.add(this.mesh.rotation, "y", -Math.PI * 2, Math.PI * 2, 0.1)
			.name("Rotation Y");
		rotationFolder
			.add(this.mesh.rotation, "z", -Math.PI * 2, Math.PI * 2, 0.1)
			.name("Rotation Z");

		positionFolder
			.add(this.mesh.position, "x", -15, 15, 0.1)
			.name("Position X");
		positionFolder
			.add(this.mesh.position, "y", -15, 15, 0.1)
			.name("Position Y");
		positionFolder
			.add(this.mesh.position, "z", -15, 15, 0.1)
			.name("Position Z");

		rotationFolder.open();
	};

	#onStlFileChange = async (e: Event) => {
		const file = (e.target as HTMLInputElement).files?.[0];

		if (file) {
			const geometry = await this.#readSTLFile(file);
			this.geometry = geometry;
			const material = new MeshBasicMaterial({
				color: 0xffffff,
				wireframe: true,
			});
			const mesh = new Mesh(geometry, material);
			const boundingBox = new Box3().setFromObject(mesh);
			const center = new Vector3();

			boundingBox.getCenter(center);
			mesh.position.sub(center);

			const size = new Vector3();
			boundingBox.getSize(size);

			// Fit the model into the camera view by scaling it down if it's too large
			const maxSize = Math.max(size.x, size.y, size.z);
			const scaleFactor = 10 / maxSize; // Adjust 10 to whatever scale fits your scene
			mesh.scale.setScalar(scaleFactor);

			this.mesh = mesh;

			const meshMergeCompatible = this.toMergeCompatible();

			if (!meshMergeCompatible) {
				return;
			}

			this.stlLoadedCallback({
				mesh,
				maxSize,
				meshMergeCompatible,
			});
			this.#addGui();
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

	toMergeCompatible = () => {
		if (!this.mesh) {
			return;
		}

		const meshCopy = this.mesh?.clone();
		const stlMeshGeo = meshCopy.geometry;

		if (!stlMeshGeo.attributes.normal) {
			stlMeshGeo.computeVertexNormals();
		}
		if (!stlMeshGeo.attributes.uv) {
			const uvBox = new Float32Array(stlMeshGeo.attributes.position.count * 2);
			stlMeshGeo.setAttribute("uv", new BufferAttribute(uvBox, 2));
		}

		return stlMeshGeo;
	};
}

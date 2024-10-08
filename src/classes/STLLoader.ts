import type GUI from "lil-gui";
import {
	Box3,
	BufferAttribute,
	type BufferGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
	Vector3,
} from "three";
import { STLLoader as ThreeSTLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import { getGui } from "@/utils/gui";

type StlLoadedCallback = (params: {
	mesh: Mesh;
	maxSize: number;
	meshMergeCompatible: BufferGeometry;
	size: Vector3;
	center: Vector3;
}) => void;

export class STLLoader {
	#gui: GUI;

	layerHeight = 0.2; // TODO: let's stick with 1mm for now. customizable later? // look for centroid 40 mm above z0
	extrusionWidth = 0.4; //TODO: is this nozzle offset?
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

		const stlFileInput = document.getElementById("stlFileInput");

		if (!stlFileInput) {
			throw new Error("STL File Input not found");
		}

		stlFileInput?.addEventListener("change", this.#onStlFileChange);
	}

	updateMatrixWorld = () => {
		if (this.mesh && this.geometry) {
			this.mesh.updateMatrixWorld(true);
			this.geometry.applyMatrix4(this.mesh.matrixWorld);
			this.geometry.computeVertexNormals();
		}
	};

	#addGui = () => {
		const rotationFolder = this.#gui.addFolder("STL Rotation");
		const positionFolder = this.#gui.addFolder("STL Position");

		if (!this.mesh) {
			return;
		}

		rotationFolder
			.add(this.mesh.rotation, "x", -Math.PI * 2, Math.PI * 2, 0.1)
			.name("X");
		rotationFolder
			.add(this.mesh.rotation, "y", -Math.PI * 2, Math.PI * 2, 0.1)
			.name("Y");
		rotationFolder
			.add(this.mesh.rotation, "z", -Math.PI * 2, Math.PI * 2, 0.1)
			.name("Z");

		positionFolder.add(this.mesh.position, "x", -15, 15, 0.1).name("X");
		positionFolder.add(this.mesh.position, "y", -15, 15, 0.1).name("Y");
		positionFolder.add(this.mesh.position, "z", -15, 15, 0.1).name("Z");

		rotationFolder.open();
	};

	#onStlFileChange = async (e: Event) => {
		const file = (e.target as HTMLInputElement).files?.[0];

		if (file) {
			const geometry = await this.#readSTLFile(file);

			geometry.computeVertexNormals();
			geometry.computeBoundingBox();

			const material = new MeshStandardMaterial({
				color: 0xffffff,
				side: DoubleSide,
			});
			const mesh = new Mesh(geometry, material);

			const boundingBox = new Box3().setFromObject(mesh);
			const size = boundingBox.getSize(new Vector3());
			const center = boundingBox.getCenter(new Vector3());
			const maxSize = Math.max(size.x, size.y, size.z);

			this.geometry = geometry;
			this.mesh = mesh;

			const meshMergeCompatible = this.toMergeCompatible();

			if (!meshMergeCompatible) {
				return;
			}

			this.stlLoadedCallback({
				mesh,
				maxSize,
				meshMergeCompatible,
				size,
				center,
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

import type GUI from "lil-gui";
import { type BufferGeometry, Mesh, MeshBasicMaterial } from "three";
import { STLLoader as ThreeSTLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import { getGui } from "@/utils/gui";

const stlFileInputId = "stlFileInput";
const stlFileInputLabelId = "stlFileInputLabel";

export class STLLoader {
	#gui: GUI;

	layerHeight = 0.2;
	extrusionWidth = 0.4;
	geometry: BufferGeometry | null = null;
	mesh: Mesh | null = null;
	stlLoadedCallback: (params: { mesh: Mesh }) => void;

	constructor({
		stlLoadedCallback,
	}: { stlLoadedCallback?: (params: { mesh: Mesh }) => void }) {
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

			this.mesh = mesh;
			// this.#generateGCode();

			mesh.scale.set(0.1, 0.1, 0.1);

			this.stlLoadedCallback({ mesh });
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
}

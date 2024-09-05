import {
	type BufferGeometry,
	Mesh,
	MeshBasicMaterial,
	type PerspectiveCamera,
} from "three";
import type { OrbitControls } from "three/examples/jsm/Addons.js";
import { STLLoader as ThreeSTLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import type { Application } from "./Application";

const stlFileInputId = "stlFileInput";
const stlFileInputLabelId = "stlFileInputLabel";

export class STLLoader {
	geometry: BufferGeometry | null = null;
	app: Application;
	controls: OrbitControls;
	camera: PerspectiveCamera;

	constructor({
		app,
		controls,
		camera,
	}: { app: Application; controls: OrbitControls; camera: PerspectiveCamera }) {
		const stlFileInput = document.getElementById(
			stlFileInputId,
		) as HTMLInputElement;

		stlFileInput.addEventListener("change", this.#onStlFileChange);

		this.app = app;
		this.controls = controls;
		this.camera = camera;
	}

	static createSTLInput = (): HTMLLabelElement => {
		const input = document.createElement("input");
		const label = document.createElement("label");

		input.type = "file";
		input.accept = ".stl";
		input.id = stlFileInputId;

		label.htmlFor = stlFileInputId;
		label.textContent = "STL file";
		label.id = stlFileInputLabelId;

		label.appendChild(input);

		return label;
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

			this.#generateGCode();

			mesh.scale.set(0.1, 0.1, 0.1);

			this.app.addToScene(mesh);
		}
	};

	#generateGCode = () => {
		if (!this.geometry) {
			return;
		}

		const vertices = this.geometry.attributes.position.array;

		// Example slicing settings
		const layerHeight = 0.2; // Layer height in mm
		let currentZ = 0;

		// Generate G-code
		let gcode = "G21 ; Set units to mm\nG90 ; Absolute positioning\n";

		// Iterate through vertices and create G-code
		for (let i = 0; i < vertices.length; i += 9) {
			const x1 = vertices[i];
			const y1 = vertices[i + 1];
			const z1 = vertices[i + 2];

			const x2 = vertices[i + 3];
			const y2 = vertices[i + 4];
			// const z2 = vertices[i + 5];

			const x3 = vertices[i + 6];
			const y3 = vertices[i + 7];
			// const z3 = vertices[i + 8];

			if (z1 >= currentZ) {
				// Add G-code for a new layer
				gcode += `; Layer at Z = ${currentZ.toFixed(2)}\n`;
				gcode += `G1 Z${currentZ.toFixed(2)} F3000\n`; // Move to new layer height
				currentZ += layerHeight;
			}

			// G-code for movement to triangle vertices
			gcode += `G1 X${x1.toFixed(2)} Y${y1.toFixed(2)} F1500 ; Move to vertex 1\n`;
			gcode += `G1 X${x2.toFixed(2)} Y${y2.toFixed(2)} ; Move to vertex 2\n`;
			gcode += `G1 X${x3.toFixed(2)} Y${y3.toFixed(2)} ; Move to vertex 3\n`;
		}

		console.log("Generated G-code:\n", gcode);
	};

	#readSTLFile = async (file: File): Promise<BufferGeometry> => {
		return new Promise((resolve, _reject) => {
			const reader = new FileReader();

			reader.onload = (e) => {
				const buffer = e.target?.result as ArrayBuffer;
				const loader = new ThreeSTLLoader();
				const geometry = loader.parse(buffer);

				resolve(geometry);
			};

			reader.readAsArrayBuffer(file);
		});
	};
}

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

	// #generateGCode = () => {
	// 	if (!this.geometry) {
	// 		return;
	// 	}

	// 	//https://docs.duet3d.com/en/User_manual/Reference/Gcodes
	// 	let gcode = "G10 P0 S195 R175\nT0\n";
	// 	let currentHeight = 0;
	// 	let extrusionAmount = 0;

	// 	// Get the bounding box of the model to determine slicing range
	// 	this.geometry.computeBoundingBox();
	// 	const boundingBox = this.geometry.boundingBox;
	// 	const maxZ = boundingBox?.max.z ?? 0;

	// 	// Iterate through each layer
	// 	while (currentHeight <= maxZ) {
	// 		const sliceLines = this.#sliceGeometry(this.geometry, currentHeight);

	// 		gcode += `; Layer at Z=${currentHeight.toFixed(2)}mm\n`;

	// 		// Convert each slice line into G-code movements
	// 		for (const line of sliceLines) {
	// 			const start = line[0];
	// 			const end = line[1];

	// 			extrusionAmount += this.#calculateExtrusion(
	// 				start,
	// 				end,
	// 				this.extrusionWidth,
	// 			);

	// 			gcode += `G1 X${start.x.toFixed(2)} Y${start.y.toFixed(2)} Z${currentHeight.toFixed(2)} F3000\n`;
	// 			gcode += `G1 X${end.x.toFixed(2)} Y${end.y.toFixed(2)} E${extrusionAmount.toFixed(4)}\n`;
	// 		}

	// 		currentHeight += this.layerHeight;
	// 	}

	// 	gcode += "M104 S0 ; Turn off extruder\n";
	// 	gcode += "M140 S0 ; Turn off bed\n";
	// 	gcode += "G28 ; Home all axes\n";
	// 	gcode += "M84 ; Disable motors\n";

	// 	return gcode;
	// };

	// #sliceGeometry = (geometry: BufferGeometry, currentHeight: number) => {
	// 	const sliceLines = [];

	// 	for (const face of geometry.faces) {
	// 		const v1 = geometry.vertices[face.a];
	// 		const v2 = geometry.vertices[face.b];
	// 		const v3 = geometry.vertices[face.c];

	// 		// Check if the triangle intersects with the current height plane
	// 		const intersections = [];
	// 		if (
	// 			(v1.z < currentHeight && v2.z > currentHeight) ||
	// 			(v1.z > currentHeight && v2.z < currentHeight)
	// 		) {
	// 			intersections.push(this.#interpolate(v1, v2, currentHeight));
	// 		}
	// 		if (
	// 			(v2.z < currentHeight && v3.z > currentHeight) ||
	// 			(v2.z > currentHeight && v3.z < currentHeight)
	// 		) {
	// 			intersections.push(this.#interpolate(v2, v3, currentHeight));
	// 		}
	// 		if (
	// 			(v3.z < currentHeight && v1.z > currentHeight) ||
	// 			(v3.z > currentHeight && v1.z < currentHeight)
	// 		) {
	// 			intersections.push(this.#interpolate(v3, v1, currentHeight));
	// 		}

	// 		// If there are exactly two intersection points, we have a line segment in this slice
	// 		if (intersections.length === 2) {
	// 			sliceLines.push(intersections);
	// 		}
	// 	}

	// 	return sliceLines;
	// };

	// #interpolate = (v1, v2, currentHeight) => {
	// 	const t = (currentHeight - v1.z) / (v2.z - v1.z);
	// 	return new Vector3(
	// 		v1.x + t * (v2.x - v1.x),
	// 		v1.y + t * (v2.y - v1.y),
	// 		currentHeight,
	// 	);
	// };

	// #calculateExtrusion = (start, end, extrusionWidth) => {
	// 	const distance = start.distanceTo(end);
	// 	return extrusionWidth * distance;
	// };

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

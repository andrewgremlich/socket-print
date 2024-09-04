import {
	type BufferGeometry,
	Mesh,
	MeshPhongMaterial,
	MeshStandardMaterial,
	type PerspectiveCamera,
	Vector3,
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
			const material = new MeshPhongMaterial({
				color: 0x0055ff,
				specular: 0x111111,
				shininess: 200,
			});
			const mesh = new Mesh(geometry, material);

			mesh.scale.set(0.1, 0.1, 0.1);

			console.log("mesh", mesh);

			this.app.addToScene(mesh);

			// https://chatgpt.com/share/12754f6c-cb3d-4688-90e0-555579bb5948
			// https://stackoverflow.com/questions/48536836/3d-slicing-web-app-javascript-and-three-js
			// https://crates.io/crates/nom_stl
			// https://crates.io/crates/stl_io
			// const plane = new Plane(new Vector3(0, 1, 0), 0);
			// const slicedGeometry = this.#sliceGeometryWithPlane(stlData, plane);

			// console.log("slicedGeometry", slicedGeometry);

			// const sliceMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
			//       const sliceMesh = new THREE.LineSegments(sliceGeometry, sliceMaterial);
			//       scene.add(sliceMesh);

			//       animate();
		}
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

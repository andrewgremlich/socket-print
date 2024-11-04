import type GUI from "lil-gui";
import {
	BufferAttribute,
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";

import { getGui } from "@/utils/gui";

export class Cylinder {
	#gui: GUI;
	#radialSegments = 64;
	// measurements in mm
	// distal cup diameter measurement from outside to the inside 90 => 78 => 66.2
	#radiusTop = 78 / 2;
	#radiusBottom = 78 / 2;
	#size: "large" | "small";

	geometry: CylinderGeometry;
	height: number;
	mesh: Mesh;

	constructor(size: "large" | "small") {
		this.height = size === "large" ? 41.3 : 28.5;

		this.#size = size;

		const material = new MeshStandardMaterial({
			color: 0xffffff,
			side: DoubleSide,
		});

		this.geometry = new CylinderGeometry(
			this.#radiusTop,
			this.#radiusBottom,
			this.height,
			this.#radialSegments,
			1,
			true,
		);
		this.mesh = new Mesh(this.geometry, material);
		this.mesh.position.set(0, this.height / 2, 0);
		this.updateMatrixWorld();

		this.#gui = getGui();

		this.#addGui();

		this.changeSizeUi();
	}

	changeSizeUi = () => {
		const button = document.createElement("button");
		button.textContent = `Change Distal Cup Size to ${this.#size === "large" ? "small" : "large"}`;

		button.addEventListener("click", () => {
			const reverseSize = this.#size === "large" ? "small" : "large";

			button.textContent = `Change Distal Cup Size to ${this.#size}`;

			this.changeSize(reverseSize);
		});

		document.getElementById("user-interface")?.appendChild(button);
	};

	changeSize = (size: "large" | "small") => {
		this.height = size === "large" ? 41.3 : 28.5;
		this.#size = size;

		this.geometry.dispose();
		this.geometry = new CylinderGeometry(
			this.#radiusTop,
			this.#radiusBottom,
			this.height,
			this.#radialSegments,
			1,
			true,
		);

		this.mesh.geometry = this.geometry;

		this.mesh.position.set(0, this.height / 2, 0);
		this.updateMatrixWorld();
	};

	toMergeCompatible = () => {
		const nonIndexCylinder = this.mesh.geometry.toNonIndexed();

		if (!nonIndexCylinder.attributes.normal) {
			nonIndexCylinder.computeVertexNormals();
		}

		if (!nonIndexCylinder.attributes.uv) {
			const uvSphere = new Float32Array(
				nonIndexCylinder.attributes.position.count * 2,
			);

			nonIndexCylinder.setAttribute("uv", new BufferAttribute(uvSphere, 2));
		}

		return nonIndexCylinder;
	};

	updateMatrixWorld = () => {
		if (this.mesh && this.geometry) {
			this.mesh.updateMatrixWorld(true);
			this.geometry.applyMatrix4(this.mesh.matrixWorld);

			this.mesh.rotation.set(0, 0, 0);
			this.mesh.position.set(0, 0, 0);
		}
	};

	#addGui() {
		const cylinderPosition = this.#gui.addFolder("Cylinder Position");

		cylinderPosition.add(this.mesh.position, "x", -100, 100, 1).name("X");
		cylinderPosition.add(this.mesh.position, "y", -100, 100, 1).name("Y");
		cylinderPosition.add(this.mesh.position, "z", -100, 100, 1).name("Z");
	}
}

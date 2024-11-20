import type GUI from "lil-gui";
import {
	BufferAttribute,
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";

import { getGui } from "@/utils/gui";
import { changeDistalCupSize, userInterface } from "@/utils/htmlElements";

import { AppObject, type AppObjectFunctions } from "./AppObject";

export class Cylinder extends AppObject implements AppObjectFunctions {
	#gui: GUI;
	#cylinderGui: GUI;
	#radialSegments = 30;
	// measurements in mm
	// distal cup diameter measurement from outside to the inside 90 => 78 => 66.2
	#radius = 78 / 2;
	#size: "large" | "small";
	height: number;

	constructor(
		size: "large" | "small" = "large",
		options: { openEnded: boolean } = { openEnded: true },
	) {
		super();

		this.height = size === "large" ? 41.3 : 28.5;
		this.#size = size;

		const material = new MeshStandardMaterial({
			color: 0xffffff,
			side: DoubleSide,
			wireframe: false,
		});
		const geometry = new CylinderGeometry(
			this.#radius,
			this.#radius,
			this.height,
			this.#radialSegments,
			1,
			options.openEnded,
		);

		this.mesh = new Mesh(geometry, material);
		this.mesh.position.set(0, this.height / 2, 0);
		this.updateMatrixWorld();

		this.#gui = getGui();
		this.#cylinderGui = this.#gui.addFolder("Cylinder Position");

		this.addGui();

		this.changeSizeUi();
	}

	changeSizeUi = () => {
		if (!changeDistalCupSize) {
			throw new Error("Change Distal Cup Size not found");
		}

		changeDistalCupSize.textContent = `Change Distal Cup Size to ${this.#size === "large" ? "small" : "large"}`;

		changeDistalCupSize.addEventListener("click", () => {
			const reverseSize = this.#size === "large" ? "small" : "large";

			if (!changeDistalCupSize) {
				throw new Error("Change Distal Cup Size not found");
			}

			changeDistalCupSize.textContent = `Change Distal Cup Size to ${this.#size}`;

			this.changeSize(reverseSize);
		});

		userInterface?.appendChild(changeDistalCupSize);
	};

	cloneCyliner = () => this.cloneMesh();

	changeSize = (size: "large" | "small") => {
		this.height = size === "large" ? 41.3 : 28.5;
		this.#size = size;

		if (!this.mesh) {
			throw new Error("Geometry or mesh is missing");
		}

		this.mesh.geometry.dispose();
		this.mesh.geometry = new CylinderGeometry(
			this.#radius,
			this.#radius,
			this.height,
			this.#radialSegments,
			1,
			true,
		);

		this.mesh.geometry = this.mesh.geometry;

		this.mesh.position.set(0, this.height / 2, 0);
		this.updateMatrixWorld();
	};

	toMergeCompatible = () => {
		if (!this.mesh) {
			throw new Error("Geometry or mesh is missing");
		}

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

	addGui() {
		if (!this.mesh) {
			throw new Error("Mesh is missing");
		}

		this.#cylinderGui.add(this.mesh.position, "x", -500, 500, 1).name("X");
		this.#cylinderGui.add(this.mesh.position, "y", -500, 500, 1).name("Y");
		this.#cylinderGui.add(this.mesh.position, "z", -500, 500, 1).name("Z");
	}

	removeGui() {
		this.#cylinderGui.destroy();
	}
}

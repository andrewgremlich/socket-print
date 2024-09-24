import { getGui } from "@/utils/gui";
import type GUI from "lil-gui";
import { type BufferGeometry, Mesh, MeshBasicMaterial } from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

export class MergeGeometries {
	#gui: GUI;

	geometries: BufferGeometry[] = [];
	mesh: Mesh | null = null;

	constructor({ geometries }: { geometries: BufferGeometry[] }) {
		this.geometries = geometries;
		this.#gui = getGui();

		const mergedGeometry = BufferGeometryUtils.mergeGeometries(this.geometries);
		const material = new MeshBasicMaterial({
			color: 0x00ff00,
			wireframe: true,
		});
		const mesh = new Mesh(mergedGeometry, material);

		this.mesh = mesh;

		this.#addGui();
	}

	static mergeGeometriesButton = () => {
		const button = document.createElement("button");

		button.textContent = "Merge Geometries";

		button.addEventListener("click", () => {
			console.log("Merging geometries");

			const mergeGeos = new MergeGeometries({
				geometries: [],
			});
		});

		document.querySelector("body")?.appendChild(button);
	};

	#addGui = () => {
		const positionFolder = this.#gui.addFolder("MergeGeometries Position");

		positionFolder
			.add(this.mesh.position, "x", -15, 15, 0.1)
			.name("Position X");
		positionFolder
			.add(this.mesh.position, "y", -15, 15, 0.1)
			.name("Position Y");
		positionFolder
			.add(this.mesh.position, "z", -15, 15, 0.1)
			.name("Position Z");
	};
}

import { type BufferGeometry, Mesh, MeshBasicMaterial } from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

import type { Cylinder } from "./Cylinder";
import type { STLLoader } from "./STLLoader";

export class MergeGeometries {
	#stlModel: STLLoader;
	#cyliner: Cylinder;
	#mesh: Mesh | null = null;

	constructor(stlModel: STLLoader, cylinder: Cylinder) {
		this.#stlModel = stlModel;
		this.#cyliner = cylinder;

		// const mergedGeometry = BufferGeometryUtils.mergeGeometries(this.geometries);
		// const material = new MeshBasicMaterial({
		// 	color: 0x00ff00,
		// 	wireframe: true,
		// });
		// const mesh = new Mesh(mergedGeometry, material);
	}

	getGeometry = () => {
		const mergedGeometry = BufferGeometryUtils.mergeGeometries([
			this.#cyliner.toMergeCompatible(),
			this.#stlModel.geometry as BufferGeometry,
		]);

		const material = new MeshBasicMaterial({
			color: 0x00ff00,
			wireframe: true,
		});

		this.#mesh = new Mesh(mergedGeometry, material);

		return this.#mesh;
	};
}

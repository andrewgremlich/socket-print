import { Mesh, MeshPhongMaterial } from "three";
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

		// TODO: orient cylinder to the bottom of the model
		// TODO: calculate centroid of model and place cylinder 40mm above z0
	}

	getGeometry = () => {
		if (this.#stlModel.geometry === null) {
			throw new Error("STL Model geometry is required");
		}

		const mergedGeometry = BufferGeometryUtils.mergeGeometries([
			this.#cyliner.toMergeCompatible(),
			this.#stlModel.geometry,
		]);

		const material = new MeshPhongMaterial({
			color: 0xffffff,
		});

		this.#mesh = new Mesh(mergedGeometry, material);

		return this.#mesh;
	};
}

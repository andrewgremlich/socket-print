import { DoubleSide, Mesh, MeshPhongMaterial, Vector3 } from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

import { AppObject } from "./AppObject";
import type { Cylinder } from "./Cylinder";
import type { STLLoader } from "./STLLoader";

export class MergeGeometries extends AppObject {
	#stlModel: STLLoader;
	#cylinder: Cylinder;

	constructor(stlModel: STLLoader, cylinder: Cylinder) {
		super();

		if (!stlModel.mesh || !cylinder.mesh) {
			throw new Error("STL Model mesh and cylinder mesh is required");
		}

		this.#stlModel = stlModel;
		this.#cylinder = cylinder;

		const mergeableCylinder = cylinder.toMergeCompatible();
		const mergedGeometry = BufferGeometryUtils.mergeGeometries([
			mergeableCylinder,
			stlModel.mesh.geometry,
		]);
		const material = new MeshPhongMaterial({
			color: 0xffffff,
		});

		this.mesh = new Mesh(mergedGeometry, material);
	}

	#orientCylinder() {
		if (this.#stlModel.mesh === null || this.#cylinder.mesh === null) {
			throw new Error("STL Model mesh and cylinder mesh is required");
		}

		// Orient the cylinder to the bottom of the model
		const bbox = this.#stlModel.mesh.geometry.boundingBox;
		if (bbox) {
			const modelMinY = bbox.min.y;
			this.#cylinder.mesh.position.y = modelMinY;
		}
	}

	#positionCylinder() {
		if (this.#stlModel.mesh === null || this.#cylinder.mesh === null) {
			throw new Error("STL Model mesh and cylinder mesh is required");
		}

		// Calculate the centroid of the model and place the cylinder 40mm above z0
		const bbox = this.#stlModel.mesh.geometry.boundingBox;
		if (bbox) {
			const centroid = new Vector3(
				(bbox.min.x + bbox.max.x) / 2,
				(bbox.min.y + bbox.max.y) / 2,
				(bbox.min.z + bbox.max.z) / 2,
			);
			this.#cylinder.mesh.position.set(centroid.x, centroid.y + 40, centroid.z);
		}
	}
}

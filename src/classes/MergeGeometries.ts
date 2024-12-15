import { Mesh, MeshPhongMaterial } from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

import { AppObject } from "./AppObject";
import type { DistalCup } from "./Cylinder";
import type { Socket } from "./STLLoader";

export class MergeGeometries extends AppObject {
	constructor(stlModel: Socket, cylinder: DistalCup) {
		super();

		if (!stlModel.mesh || !cylinder.mesh) {
			throw new Error("STL Model mesh and cylinder mesh is required");
		}

		const mergeableCylinder = cylinder.toMergeCompatible();

		console.log(mergeableCylinder, stlModel.mesh.geometry);

		const mergedGeometry = BufferGeometryUtils.mergeGeometries([
			mergeableCylinder,
			stlModel.mesh.geometry,
		]);
		const material = new MeshPhongMaterial({
			color: 0xffffff,
			wireframe: true,
		});

		this.mesh = new Mesh(mergedGeometry, material);
	}
}

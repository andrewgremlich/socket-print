import { CSG } from "three-csg-ts";

import { Box3 } from "three";
import { AppObject } from "./AppObject";
import type { Cylinder } from "./Cylinder";
import type { STLLoader } from "./STLLoader";

export class EvaluateGeometries extends AppObject {
	boundingBox: Box3;

	constructor(stlModel: STLLoader, cylinder: Cylinder) {
		super();

		if (!stlModel.mesh) {
			throw new Error("STL data has not been loaded!");
		}

		if (!cylinder.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		stlModel.updateMatrixWorld();
		cylinder.updateMatrixWorld();

		const subtraction = CSG.union(stlModel.mesh, cylinder.mesh);

		this.mesh = subtraction;
		const boundingBox = new Box3().setFromObject(this.mesh);
		this.boundingBox = boundingBox;

		this.updateMatrixWorld();
	}
}

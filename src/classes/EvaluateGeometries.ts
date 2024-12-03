import { CSG } from "three-csg-ts";

import { Box3, CylinderGeometry, Mesh } from "three";
import { AppObject } from "./AppObject";
import type { Cylinder } from "./Cylinder";
import type { STLLoader } from "./STLLoader";

export class EvaluateGeometries extends AppObject {
	boundingBox: Box3;

	constructor(stlModel: STLLoader, cylinder: Cylinder) {
		super();

		if (!cylinder.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		if (!stlModel.mesh) {
			throw new Error("STL data has not been loaded!");
		}

		const clonedCylinder = this.cloneCylinder(cylinder);
		const subtraction = CSG.union(stlModel.mesh, clonedCylinder);

		this.mesh = subtraction;
		this.boundingBox = new Box3().setFromObject(subtraction);

		this.updateMatrixWorld();
	}

	cloneCylinder = (cylinder: Cylinder) => {
		if (!cylinder.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		const { height, ...cylinderParams } = (
			cylinder.mesh.geometry as CylinderGeometry
		).parameters;
		const clonedCylinderGeometry = new CylinderGeometry(
			cylinderParams.radiusTop,
			cylinderParams.radiusBottom,
			200,
			cylinderParams.radialSegments,
			cylinderParams.heightSegments,
			cylinderParams.openEnded,
		);
		const mesh = new Mesh(clonedCylinderGeometry, cylinder.mesh.material);
		const boundingBox = new Box3().setFromObject(mesh);

		mesh.position.y += Math.abs(boundingBox.min.y);

		mesh.updateMatrixWorld();

		return mesh;
	};
}

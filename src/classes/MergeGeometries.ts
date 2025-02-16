import { Box3, CylinderGeometry, Mesh, Vector3 } from "three";
import { CSG } from "three-csg-ts";

import { AppObject } from "./AppObject";
import type { DistalCup } from "./DistalCup";
import type { Socket } from "./Socket";

export class MergeGeometries extends AppObject {
	constructor(stlModel: Socket, cylinder: DistalCup) {
		super();

		if (!cylinder.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		if (!stlModel.mesh) {
			throw new Error("STL data has not been loaded!");
		}

		const clonedCylinder = this.cloneCylinder(cylinder, stlModel.size.y);
		const union = CSG.union(stlModel.mesh, clonedCylinder);

		this.boundingBox = new Box3().setFromObject(union);
		this.size = this.boundingBox.getSize(new Vector3());
		this.center = this.boundingBox.getCenter(new Vector3());
		this.mesh = union;

		this.mesh.matrixWorldAutoUpdate = true;
	}

	cloneCylinder = (cylinder: DistalCup, newHeight: number) => {
		if (!cylinder.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		const { height, ...cylinderParams } = (
			cylinder.mesh.geometry as CylinderGeometry
		).parameters;
		const clonedCylinderGeometry = new CylinderGeometry(
			cylinderParams.radiusTop,
			cylinderParams.radiusBottom,
			newHeight,
			cylinderParams.radialSegments,
			cylinderParams.heightSegments,
			cylinderParams.openEnded,
		);
		const mesh = new Mesh(clonedCylinderGeometry, cylinder.mesh.material);

		mesh.position.set(0, newHeight / 2, 0);

		mesh.updateMatrixWorld(true);

		return mesh;
	};
}

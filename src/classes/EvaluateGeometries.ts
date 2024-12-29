import { Box3, CylinderGeometry, Mesh, Vector3 } from "three";
import { CSG } from "three-csg-ts";

import { AppObject } from "./AppObject";
import type { DistalCup } from "./DistalCup";
import type { Socket } from "./Socket";

export class EvaluateGeometries extends AppObject {
	boundingBox: Box3;
	size: Vector3;
	center: Vector3;

	constructor(stlModel: Socket, cylinder: DistalCup) {
		super();

		if (!cylinder.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		if (!stlModel.mesh) {
			throw new Error("STL data has not been loaded!");
		}

		const clonedCylinder = this.cloneCylinder(cylinder);
		const subtraction = CSG.union(stlModel.mesh, clonedCylinder);

		this.boundingBox = new Box3().setFromObject(subtraction);
		this.size = this.boundingBox.getSize(new Vector3());
		this.center = this.boundingBox.getCenter(new Vector3());
		this.mesh = subtraction;

		this.mesh.geometry.computeBoundingBox();
		this.mesh.geometry.computeBoundingSphere();
		this.mesh.geometry.computeVertexNormals();

		this.updateMatrixWorld();
	}

	cloneCylinder = (cylinder: DistalCup) => {
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

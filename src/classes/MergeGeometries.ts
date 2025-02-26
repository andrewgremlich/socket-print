import { Box3, CylinderGeometry, Mesh, Vector3 } from "three";
import { CSG } from "three-csg-ts";

import { AppObject } from "./AppObject";
import type { MergeCup } from "./MergeCup";
import type { Socket } from "./Socket";

export class MergeGeometries extends AppObject {
	constructor(stlModel: Socket, cylinder: MergeCup) {
		super();

		if (!cylinder.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		if (!stlModel.mesh) {
			throw new Error("STL data has not been loaded!");
		}

		const clearBelowZ0 = this.cloneCylinder(cylinder.mesh, {
			newHeight: 20,
			radius: 100,
			openEnded: false,
			heightPlacement: -10,
		});
		const subtractBelowZ0 = CSG.subtract(stlModel.mesh, clearBelowZ0);

		// const clearCylinder = this.cloneCylinder(cylinder.mesh, {
		// 	newHeight: 40,
		// 	radius: 100,
		// 	openEnded: false,
		// });
		// const subtract = CSG.subtract(stlModel.mesh, clearCylinder);

		const clonedCylinder = this.cloneCylinder(cylinder.mesh, {
			newHeight: stlModel.size.y,
		});
		const union = CSG.union(subtractBelowZ0, clonedCylinder);

		this.boundingBox = new Box3().setFromObject(union);
		this.size = this.boundingBox.getSize(new Vector3());
		this.center = this.boundingBox.getCenter(new Vector3());
		this.mesh = union;

		this.mesh.matrixWorldAutoUpdate = true;
	}

	cloneCylinder = (
		cylinder: Mesh,
		{
			newHeight,
			radius,
			openEnded,
			heightPlacement,
		}: {
			newHeight?: number;
			radius?: number;
			openEnded?: boolean;
			heightPlacement?: number;
		} = {},
	) => {
		if (!cylinder) {
			throw new Error("Mesh not found");
		}

		const { height, ...cylinderParams } = (
			cylinder.geometry as CylinderGeometry
		).parameters;
		const h = newHeight !== undefined ? newHeight : height;
		const clonedCylinderGeometry = new CylinderGeometry(
			radius !== undefined ? radius : cylinderParams.radiusTop,
			radius !== undefined ? radius : cylinderParams.radiusBottom,
			h,
			cylinderParams.radialSegments,
			cylinderParams.heightSegments,
			openEnded !== undefined ? openEnded : cylinderParams.openEnded,
		);
		const mesh = new Mesh(clonedCylinderGeometry, cylinder.material);

		mesh.position.set(
			0,
			heightPlacement !== undefined ? heightPlacement : h / 2,
			0,
		);

		mesh.updateMatrixWorld(true);

		return mesh;
	};
}

import {
	type BufferGeometry,
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";
import {
	ADDITION,
	Brush,
	type CSGOperation,
	Evaluator,
	SUBTRACTION,
} from "three-bvh-csg";

import { AppObject } from "./AppObject";
import type { Cylinder } from "./Cylinder";
import type { STLLoader } from "./STLLoader";

export class EvaluateGeometries extends AppObject {
	hiddenCylinderDebug: Mesh | null = null;

	constructor(stlModel: STLLoader, cylinder: Cylinder) {
		super();
		const clipCylinder = this.createClipCylinder(cylinder);

		this.hiddenCylinderDebug = clipCylinder;

		if (!stlModel.mesh) {
			throw new Error("STL data has not been loaded!");
		}

		if (!cylinder.mesh) {
			throw new Error("Cylinder mesh not found");
		}

		const clipCylinderBrush = this.evaluateGeometry(clipCylinder.geometry);
		const visibleCylinderBrush = this.evaluateGeometry(cylinder.mesh.geometry);
		const stlBrush = this.evaluateGeometry(stlModel.mesh.geometry);

		this.mesh = this.evaluateBrushes(stlBrush, clipCylinderBrush, SUBTRACTION);
		// this.mesh = this.evaluateBrushes(
		// 	subtractionEvaluator,
		// 	visibleCylinderBrush,
		// 	ADDITION,
		// );

		this.updateMatrixWorld();

		cylinder.mesh.visible = false;
		stlModel.mesh.visible = false;
	}

	evaluateGeometry = (geometry: BufferGeometry) => {
		const brushMaterial = new MeshStandardMaterial({
			color: 0x00ff00,
			roughness: 0.5,
			metalness: 0.1,
			side: DoubleSide,
		});
		const brush = new Brush(geometry, brushMaterial);

		this.updateMatrixWorld();

		return brush;
	};

	evaluateBrushes = (brush1: Brush, brush2: Brush, operation: CSGOperation) => {
		const evaluator = new Evaluator();
		const result = evaluator.evaluate(brush1, brush2, operation);

		return result;
	};

	createClipCylinder = (cylinder: Cylinder) => {
		const clonedCylinder = cylinder.cloneCyliner();

		if (!clonedCylinder) {
			throw new Error("Cylinder clone not found");
		}

		if (!cylinder.mesh) {
			throw new Error("Cylinder geometry not found");
		}

		const { radiusTop, radiusBottom, radialSegments, heightSegments, height } =
			(cylinder.mesh.geometry as CylinderGeometry).parameters;
		const openEndedGeometry = new CylinderGeometry(
			radiusTop,
			radiusBottom,
			height + 200,
			radialSegments,
			heightSegments,
			false,
		);

		const newMeshCylinder = new Mesh(
			openEndedGeometry,
			clonedCylinder.material,
		);

		clonedCylinder.position.copy(cylinder.mesh.position);
		clonedCylinder.rotation.copy(cylinder.mesh.rotation);
		clonedCylinder.scale.copy(cylinder.mesh.scale);

		return newMeshCylinder;
	};
}

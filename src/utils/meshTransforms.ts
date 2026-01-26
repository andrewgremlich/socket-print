import { abs } from "mathjs";
import type { Box3, Mesh, Vector3 } from "three";
import {
	updateRotateValues,
	updateTranslateValues,
} from "@/db/appSettingsDbActions";

export type TransformAxis = "x" | "y" | "z";

/**
 * Auto-aligns a mesh by centering it on X/Z and adjusting Y based on lock depth.
 */
export const autoAlignMesh = (
	mesh: Mesh,
	boundingBox: Box3,
	center: Vector3,
	lockDepth: number | null,
): void => {
	const minY = boundingBox.min.y;

	mesh.position.x -= center.x;
	mesh.position.z -= center.z;

	if (minY < 0 && lockDepth !== null) {
		mesh.position.y += abs(minY) - lockDepth;
	}
};

/**
 * Applies a rotation to a mesh on the specified axis.
 */
export const applyRotation = (
	mesh: Mesh,
	axis: TransformAxis,
	amount: number,
): void => {
	switch (axis) {
		case "x":
			mesh.rotateX(amount);
			break;
		case "y":
			mesh.rotateY(amount);
			break;
		case "z":
			mesh.rotateZ(amount);
			break;
	}
};

/**
 * Saves the current mesh rotation values to the database.
 * Note: The parameter order is (coronal/x, sagittal/z, transverse/y) to match DB schema.
 */
export const saveRotationToDatabase = async (mesh: Mesh): Promise<void> => {
	await updateRotateValues(mesh.rotation.x, mesh.rotation.z, mesh.rotation.y);
};

/**
 * Applies a translation to a mesh on the specified axis.
 */
export const applyTranslation = (
	mesh: Mesh,
	axis: TransformAxis,
	value: number,
	offsetYPosition: number,
): void => {
	switch (axis) {
		case "x":
			mesh.position.setX(-value);
			break;
		case "y":
			mesh.position.setY(value + offsetYPosition);
			break;
		case "z":
			mesh.position.setZ(-value);
			break;
	}
};

/**
 * Saves the current mesh translation values to the database.
 */
export const saveTranslationToDatabase = async (mesh: Mesh): Promise<void> => {
	await updateTranslateValues(
		mesh.position.x,
		mesh.position.y,
		mesh.position.z,
	);
};

import type { Box3, Mesh, Vector3 } from "three";
import type { PrintObjectType } from "@/db/types";

/**
 * Represents the result of a collision check.
 */
export type CollisionState = {
	hasCollision: boolean;
	hasInvalidFit: boolean;
	message: string | null;
};

/**
 * Context required for mesh transformations.
 */
export interface MeshContext {
	mesh: Mesh;
	lockDepth: number | null;
	offsetYPosition: number;
}

/**
 * Callback invoked after transform changes.
 */
export type TransformChangeCallback = () => Promise<void>;

/**
 * Callback for computing bounding box and returning updated values.
 */
export type ComputeBoundingBoxCallback = () => {
	boundingBox: Box3 | undefined;
	center: Vector3 | undefined;
};

/**
 * Interface for collision detection functionality.
 */
export interface ICollisionDetector {
	checkCollision(
		mesh: Mesh | undefined,
		currentType: PrintObjectType | undefined,
	): Promise<CollisionState>;
	dispose(): void;
	getTransitionInstance(): unknown;
	isValidFit(): boolean;
}

/**
 * Interface for mesh transformation control.
 */
export interface IMeshTransformController {
	setMesh(context: MeshContext): void;
	onTransformChange(callback: TransformChangeCallback): void;
	autoAlign(computeBoundingBox: ComputeBoundingBoxCallback): void;
	restoreFromDatabase(loadedFromDb: boolean): Promise<void>;
	handleRotation(
		axis: "x" | "y" | "z",
		amount: number,
		computeBoundingBox: ComputeBoundingBoxCallback,
	): Promise<void>;
	handleTranslation(axis: "x" | "y" | "z", evt: Event): Promise<void>;
	resetDatabase(): Promise<void>;
	clear(): void;
}

/**
 * Interface for event management.
 */
export interface IEventManager {
	attach(): void;
	detach(): void;
	toggleInputs(disabled: boolean): void;
}

/**
 * Error display callback type.
 */
export type ErrorCallback = (message: string) => void;

/**
 * Axis types for transformations.
 */
export type TransformAxis = "x" | "y" | "z";

export type TransformControlsOptions = {
	mode?: "translate" | "rotate" | "scale";
	showX?: boolean;
	showY?: boolean;
	showZ?: boolean;
	size?: number;
	onChange?: () => void | Promise<void>;
};

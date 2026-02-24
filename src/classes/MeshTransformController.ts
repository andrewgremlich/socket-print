import { round } from "mathjs";
import type { Mesh } from "three";
import {
	getRotateValues,
	getTranslateValues,
	updateRotateValues,
	updateTranslateValues,
} from "@/db/appSettingsDbActions";
import {
	depthTranslate,
	horizontalTranslate,
	verticalTranslate,
} from "@/utils/htmlElements";
import {
	applyRotation,
	applyTranslation,
	autoAlignMesh,
	saveRotationToDatabase,
	saveTranslationToDatabase,
} from "@/utils/meshTransforms";
import type {
	ComputeBoundingBoxCallback,
	ErrorCallback,
	IMeshTransformController,
	MeshContext,
	TransformAxis,
	TransformChangeCallback,
} from "./types";

/**
 * Controls mesh transformations (rotation/translation) with automatic
 * database synchronization and UI updates.
 */
export class MeshTransformController implements IMeshTransformController {
	#mesh: Mesh | null = null;
	#lockDepth: number | null = null;
	#offsetYPosition = 0;
	#onTransformChange: TransformChangeCallback | null = null;
	#showError: ErrorCallback;

	constructor(showError: ErrorCallback) {
		this.#showError = showError;
	}

	/**
	 * Sets the mesh to control and its bounding information.
	 */
	setMesh(context: MeshContext): void {
		this.#mesh = context.mesh;
		this.#lockDepth = context.lockDepth;
		this.#offsetYPosition = context.offsetYPosition;
	}

	/**
	 * Sets a callback to be invoked after any transform change.
	 */
	onTransformChange(callback: TransformChangeCallback): void {
		this.#onTransformChange = callback;
	}

	/**
	 * Auto-aligns the mesh by centering on X/Z and adjusting Y based on lock depth.
	 * The callback should compute the bounding box and return the updated values.
	 */
	autoAlign(computeBoundingBox: ComputeBoundingBoxCallback): void {
		if (!this.#mesh) return;

		const { boundingBox, center } = computeBoundingBox();
		if (!boundingBox || !center) return;

		autoAlignMesh(this.#mesh, boundingBox, center, this.#lockDepth);
	}

	/**
	 * Applies rotation and translation values from the database.
	 */
	async restoreFromDatabase(loadedFromDb: boolean): Promise<void> {
		if (!this.#mesh) return;

		let translateValues = { x: 0, y: 0, z: 0 };
		let rotateValues = { x: 0, y: 0, z: 0 };

		try {
			translateValues = await getTranslateValues();
			rotateValues = await getRotateValues();
		} catch (error) {
			console.error("Failed to get transform values from database:", error);
			this.#showError("Failed to load position settings");
		}

		if (loadedFromDb) {
			this.#mesh.position.set(
				translateValues.x,
				translateValues.y,
				translateValues.z,
			);
		} else {
			this.#mesh.position.set(0, this.#offsetYPosition, 0);
		}

		this.#mesh.rotation.set(rotateValues.x, rotateValues.z, rotateValues.y);

		try {
			await updateTranslateValues(
				this.#mesh.position.x,
				this.#mesh.position.y,
				this.#mesh.position.z,
			);
			await updateRotateValues(rotateValues.x, rotateValues.y, rotateValues.z);
		} catch (error) {
			console.error("Failed to save transform values to database:", error);
			this.#showError("Failed to save position settings");
		}

		this.#syncInputsFromMesh();
	}

	/**
	 * Syncs the UI inputs to reflect current mesh position.
	 */
	#syncInputsFromMesh(): void {
		if (!this.#mesh) return;

		horizontalTranslate.value = (-this.#mesh.position.x).toString();
		verticalTranslate.value = round(
			this.#mesh.position.y - this.#offsetYPosition,
			0,
		).toString();
		depthTranslate.value = (-this.#mesh.position.z).toString();
	}

	/**
	 * Handles a rotation change on the specified axis.
	 */
	async handleRotation(
		axis: TransformAxis,
		amount: number,
		computeBoundingBox: ComputeBoundingBoxCallback,
	): Promise<void> {
		if (!this.#mesh) return;

		applyRotation(this.#mesh, axis, amount);
		this.autoAlign(computeBoundingBox);

		try {
			await saveRotationToDatabase(this.#mesh);
		} catch (error) {
			console.error("Failed to save rotation values to database:", error);
			this.#showError("Failed to save rotation settings");
		}

		await this.#onTransformChange?.();
	}

	/**
	 * Handles a translation change on the specified axis.
	 */
	async handleTranslation(axis: TransformAxis, evt: Event): Promise<void> {
		if (!this.#mesh) return;

		const targetValue = (evt.target as HTMLInputElement).value;
		const numVal = Number.parseInt(targetValue, 10);

		if (Number.isNaN(numVal)) return;

		applyTranslation(this.#mesh, axis, numVal, this.#offsetYPosition);

		try {
			await saveTranslationToDatabase(this.#mesh);
		} catch (error) {
			console.error("Failed to save translation values to database:", error);
			this.#showError("Failed to save position settings");
		}

		await this.#onTransformChange?.();
	}

	/**
	 * Resets transform values in the database.
	 */
	async resetDatabase(): Promise<void> {
		try {
			await updateRotateValues(0, 0, 0);
			await updateTranslateValues(0, 0, 0);
		} catch (error) {
			console.error("Failed to reset transform values in database:", error);
			this.#showError("Failed to reset position settings");
		}
	}

	/**
	 * Clears the mesh reference.
	 */
	clear(): void {
		this.#mesh = null;
		this.#lockDepth = null;
		this.#offsetYPosition = 0;
	}
}

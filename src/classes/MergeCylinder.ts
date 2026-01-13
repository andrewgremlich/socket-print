import { liveQuery, type Subscription } from "dexie";
import { floor } from "mathjs";
import {
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";
import { getTestCylinderInnerDiameter } from "@/db/appSettingsDbActions";
import { getNozzleSize } from "@/db/formValuesDbActions";
import { getActiveMaterialProfileShrinkFactor } from "@/db/materialProfilesDbActions";
import { getRadialSegments } from "@/utils/getRadialSegments";
import { AppObject } from "./AppObject";

// Nozzle size offset factor - same as in generateGCode.ts
const NOZZLE_SIZE_OFFSET_FACTOR = 2;

export class MergeCylinder extends AppObject {
	#radialSegments = 128; // default; replaced from DB
	#radius = 78 / 2;
	height: number;
	$liveTestCylinderInnerDiameter: Subscription;

	private constructor(options?: { height: number }) {
		super();
		this.height = options?.height ?? 0;

		this.$liveTestCylinderInnerDiameter = liveQuery(() =>
			getTestCylinderInnerDiameter(),
		).subscribe(async (diameter) => {
			if (!diameter || diameter <= 0 || !this.mesh) return;

			// Apply the same transformation as in generateGCode.ts
			const shrinkFactor = await getActiveMaterialProfileShrinkFactor();
			const nozzleSize = await getNozzleSize();
			const shrinkScale = floor(1 / (1 - shrinkFactor / 100), 4);
			const nozzleSizeOffset = nozzleSize / NOZZLE_SIZE_OFFSET_FACTOR;
			const startingX = diameter / 2;
			const transformedRadius = startingX * shrinkScale + nozzleSizeOffset;

			this.#radius = transformedRadius;
			this.updateGeometry();
		});
	}

	static async create(options?: { height: number }): Promise<MergeCylinder> {
		const instance = new MergeCylinder(options);
		const radialSegments = await getRadialSegments();
		instance.#radialSegments = radialSegments;

		// Apply the same transformation as in generateGCode.ts for initial radius
		const diameter = await getTestCylinderInnerDiameter();
		const shrinkFactor = await getActiveMaterialProfileShrinkFactor();
		const nozzleSize = await getNozzleSize();
		const shrinkScale = floor(1 / (1 - shrinkFactor / 100), 4);
		const nozzleSizeOffset = nozzleSize / NOZZLE_SIZE_OFFSET_FACTOR;
		const startingX = diameter / 2;
		const transformedRadius = startingX * shrinkScale + nozzleSizeOffset;
		instance.#radius = transformedRadius;

		const material = new MeshStandardMaterial({
			color: 0xffffff,
			side: DoubleSide,
		});
		const geometry = new CylinderGeometry(
			instance.#radius,
			instance.#radius,
			instance.height,
			instance.#radialSegments,
			1,
			true,
		);
		instance.mesh = new Mesh(geometry, material);
		instance.mesh.position.set(0, instance.height / 2, 0);
		instance.updateMatrixWorld();
		return instance;
	}

	private updateGeometry(): void {
		const newGeometry = new CylinderGeometry(
			this.#radius,
			this.#radius,
			this.height,
			this.#radialSegments,
			1,
			true,
		);
		this.mesh.geometry.dispose();
		this.mesh.geometry = newGeometry;
		this.mesh.position.set(0, this.height / 2, 0);
		this.updateMatrixWorld();
	}

	setHeight(newHeight: number): void {
		this.height = newHeight;
		this.updateGeometry();
	}

	dispose(): void {
		if (this.$liveTestCylinderInnerDiameter) {
			this.$liveTestCylinderInnerDiameter.unsubscribe();
			this.$liveTestCylinderInnerDiameter = null;
		}
		if (this.mesh) {
			(this.mesh.material as MeshStandardMaterial).dispose();
			this.mesh.geometry.dispose();
		}
	}
}

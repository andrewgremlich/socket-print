import { liveQuery, type Subscription } from "dexie";
import {
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";
import { getTestCylinderDiameter } from "@/db/appSettingsDbActions";
import { getRadialSegments } from "@/utils/getRadialSegments";
import { AppObject } from "./AppObject";

export class MergeCylinder extends AppObject {
	#radialSegments = 128; // default; replaced from DB
	#radius = 78 / 2;
	height: number;
	$liveTestCylinderDiameter: Subscription;

	private constructor(options?: { height: number }) {
		super();
		this.height = options?.height ?? 0;

		this.$liveTestCylinderDiameter = liveQuery(() =>
			getTestCylinderDiameter(),
		).subscribe((diameter) => {
			if (!diameter || diameter <= 0 || !this.mesh) return;
			this.#radius = diameter / 2;
			this.updateGeometry();
		});
	}

	static async create(options?: { height: number }): Promise<MergeCylinder> {
		const instance = new MergeCylinder(options);
		const radialSegments = await getRadialSegments();
		instance.#radialSegments = radialSegments;

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
		if (this.$liveTestCylinderDiameter) {
			this.$liveTestCylinderDiameter.unsubscribe();
			this.$liveTestCylinderDiameter = null;
		}
		if (this.mesh) {
			(this.mesh.material as MeshStandardMaterial).dispose();
			this.mesh.geometry.dispose();
		}
	}
}

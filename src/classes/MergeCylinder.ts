import {
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";
import { getCircularSegments } from "@/db/appSettingsDbActions";
import { AppObject } from "./AppObject";

export class MergeCylinder extends AppObject {
	#radialSegments = 128; // default; replaced from DB
	#radius = 78 / 2;
	height: number;

	private constructor(options?: { height: number }) {
		super();
		this.height = options?.height ?? 0;
	}

	static async create(options?: { height: number }): Promise<MergeCylinder> {
		const instance = new MergeCylinder(options);
		const circularSegmentsDb = await getCircularSegments();
		const radialSegments =
			Number.isFinite(circularSegmentsDb) && circularSegmentsDb >= 3
				? Math.min(512, Math.max(3, Math.floor(circularSegmentsDb)))
				: 128;
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

	setHeight(newHeight: number): void {
		this.height = newHeight;
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
}

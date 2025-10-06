import {
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";
import { getRadialSegments } from "@/utils/getRadialSegments";
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

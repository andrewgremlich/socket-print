import { DoubleSide, Mesh, MeshStandardMaterial, RingGeometry } from "three";
import { AppObject } from "./AppObject";

export class Ring extends AppObject {
	#radialSegments = 128;
	#innerRadius = 78 / 2;
	#thickness = 10;
	height: number;

	constructor() {
		super();

		this.height = 0;

		const material = new MeshStandardMaterial({
			color: 0xffffff,
			side: DoubleSide,
		});
		const geometry = new RingGeometry(
			this.#innerRadius, // inner radius
			this.#innerRadius + this.#thickness, // outer radius
			this.#radialSegments,
		);

		this.mesh = new Mesh(geometry, material);
		this.mesh.position.set(0, 0, 0);
		this.mesh.rotation.x = Math.PI / 2;

		this.updateMatrixWorld();
	}
}

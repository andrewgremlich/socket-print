import { pi } from "mathjs";
import { DoubleSide, Mesh, MeshStandardMaterial, RingGeometry } from "three";
import { acceleratedRaycast, MeshBVH } from "three-mesh-bvh";
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
		const mesh = new Mesh(geometry, material);
		const bvh = new MeshBVH(mesh.geometry);

		this.mesh = mesh;
		this.mesh.raycast = acceleratedRaycast;
		this.mesh.name = "ring";
		this.mesh.geometry.boundsTree = bvh;
		this.mesh.position.set(0, 0, 0);
		this.mesh.rotation.x = pi / 2;

		this.updateMatrixWorld();
	}
}

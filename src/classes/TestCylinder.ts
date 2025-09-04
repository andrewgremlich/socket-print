import {
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";
import { acceleratedRaycast, MeshBVH } from "three-mesh-bvh";
import { ensureUV } from "@/3d/ensureUV";
import { AppObject } from "./AppObject";

export class TestCylinder extends AppObject {
	#radialSegments = 128;
	#radius = 75 / 2;
	constructor() {
		super();

		const height = 100;

		const material = new MeshStandardMaterial({
			color: 0xffffff,
			side: DoubleSide,
		});
		const geometry = new CylinderGeometry(
			this.#radius,
			this.#radius,
			height,
			this.#radialSegments,
			1,
			true,
		);

		const mesh = new Mesh(geometry, material);

		const bvh = new MeshBVH(mesh.geometry);

		this.mesh = mesh;
		ensureUV(this.mesh.geometry);
		this.mesh.raycast = acceleratedRaycast;
		this.mesh.geometry.boundsTree = bvh;

		mesh.position.set(0, height / 2, 0);

		this.computeBoundingBox();
	}
}

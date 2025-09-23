import { pi } from "mathjs";
import { DoubleSide, Mesh, MeshStandardMaterial, RingGeometry } from "three";
import { acceleratedRaycast, MeshBVH } from "three-mesh-bvh";
import { getCircularSegments } from "@/db/appSettingsDbActions";
import { AppObject } from "./AppObject";

export class Ring extends AppObject {
	#radialSegments = 128; // default, replaced from DB
	#innerRadius = 78 / 2;
	#thickness = 10;
	height: number;

	private constructor() {
		super();
		this.height = 0;
	}

	static async create(): Promise<Ring> {
		const instance = new Ring();
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
		const geometry = new RingGeometry(
			instance.#innerRadius,
			instance.#innerRadius + instance.#thickness,
			instance.#radialSegments,
		);
		const mesh = new Mesh(geometry, material);
		const bvh = new MeshBVH(mesh.geometry);

		instance.mesh = mesh;
		instance.mesh.raycast = acceleratedRaycast;
		instance.mesh.name = "ring";
		instance.mesh.geometry.boundsTree = bvh;
		instance.mesh.position.set(0, 0, 0);
		instance.mesh.rotation.x = pi / 2;
		instance.updateMatrixWorld();
		return instance;
	}
}

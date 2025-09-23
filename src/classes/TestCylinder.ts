import {
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";
import { acceleratedRaycast, MeshBVH } from "three-mesh-bvh";
import { ensureUV } from "@/3d/ensureUV";
import {
	getCircularSegments,
	getTestCylinderDiameter,
	getTestCylinderHeight,
} from "@/db/appSettingsDbActions";
import { AppObject } from "./AppObject";

export class TestCylinder extends AppObject {
	#radialSegments = 128; // default; overwritten from DB
	#radius = 75 / 2; // will be overridden by DB value

	private constructor() {
		super();
	}

	static async create(): Promise<TestCylinder> {
		const instance = new TestCylinder();

		// Fetch dimensions + radial segment count from IndexedDB, fall back if invalid.
		const [heightDb, diameterDb, circularSegmentsDb] = await Promise.all([
			getTestCylinderHeight(),
			getTestCylinderDiameter(),
			getCircularSegments(),
		]);

		const height = Number.isFinite(heightDb) && heightDb > 0 ? heightDb : 50;
		const diameter =
			Number.isFinite(diameterDb) && diameterDb > 0 ? diameterDb : 75;
		const radialSegments =
			Number.isFinite(circularSegmentsDb) && circularSegmentsDb >= 3
				? Math.min(512, Math.max(3, Math.floor(circularSegmentsDb)))
				: 128; // clamp + fallback

		instance.#radius = diameter / 2;
		instance.#radialSegments = radialSegments;

		const material = new MeshStandardMaterial({
			color: 0xffffff,
			side: DoubleSide,
		});
		const geometry = new CylinderGeometry(
			instance.#radius,
			instance.#radius,
			height,
			instance.#radialSegments,
			1,
			true,
		);

		const mesh = new Mesh(geometry, material);
		const bvh = new MeshBVH(mesh.geometry);

		instance.mesh = mesh;
		ensureUV(instance.mesh.geometry);
		instance.mesh.raycast = acceleratedRaycast;
		instance.mesh.geometry.boundsTree = bvh;

		mesh.position.set(0, height / 2, 0);

		instance.computeBoundingBox();
		return instance;
	}
}

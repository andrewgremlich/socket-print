import {
	DoubleSide,
	LineCurve3,
	Mesh,
	MeshStandardMaterial,
	TubeGeometry,
	Vector3,
} from "three";
import {
	acceleratedRaycast,
	computeBoundsTree,
	disposeBoundsTree,
	MeshBVH,
} from "three-mesh-bvh";
import { getTestCylinderInnerDiameter } from "@/db/appSettingsDbActions";
import { getRadialSegments } from "@/utils/getRadialSegments";
import { AppObject } from "./AppObject";

export class Tube extends AppObject {
	#radius = 78 / 2;
	#height = 25;
	#radialSegments = 128;
	#tubularSegments = 128;

	private constructor() {
		super();
	}

	static async create() {
		const instance = new Tube();

		const [diameterDb, radialSegments] = await Promise.all([
			getTestCylinderInnerDiameter(),
			getRadialSegments(),
		]);
		const diameter = diameterDb ? diameterDb : 75;

		instance.#radius = diameter / 2;
		instance.#radialSegments = radialSegments;

		const path = new LineCurve3(
			new Vector3(0, 0, 0),
			new Vector3(0, -instance.#height, 0),
		);
		const material = new MeshStandardMaterial({
			color: 0xb1314d, // Softer red color
			side: DoubleSide,
			wireframe: import.meta.env.DEV,
		});
		const geometry = new TubeGeometry(
			path,
			instance.#radialSegments,
			instance.#radius,
			instance.#tubularSegments,
			false,
		);
		const mesh = new Mesh(geometry, material);
		const bvh = new MeshBVH(geometry);

		instance.mesh = mesh;
		instance.mesh.raycast = acceleratedRaycast;
		instance.mesh.geometry.computeBoundsTree = computeBoundsTree;
		instance.mesh.geometry.disposeBoundsTree = disposeBoundsTree;
		instance.mesh.geometry.boundsTree = bvh;

		return instance;
	}
}

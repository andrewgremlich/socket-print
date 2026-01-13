import { liveQuery, type Subscription } from "dexie";
import {
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
} from "three";
import { acceleratedRaycast, MeshBVH } from "three-mesh-bvh";
import { ensureUV } from "@/3d/ensureUV";
import {
	getTestCylinderHeight,
	getTestCylinderInnerDiameter,
} from "@/db/appSettingsDbActions";
import { getRadialSegments } from "@/utils/getRadialSegments";
import { AppObject } from "./AppObject";

export class TestCylinder extends AppObject {
	#radialSegments = 128;
	#radius = 75 / 2;
	#height = 50;
	$liveTestCylinderInnerDiameter: Subscription;
	$liveTestCylinderHeight: Subscription;

	private constructor() {
		super();

		this.$liveTestCylinderInnerDiameter = liveQuery(() =>
			getTestCylinderInnerDiameter(),
		).subscribe((diameter) => {
			if (!diameter || diameter <= 0 || !this.mesh) return;
			this.updateRadius(diameter / 2);
		});

		this.$liveTestCylinderHeight = liveQuery(() =>
			getTestCylinderHeight(),
		).subscribe((height) => {
			if (!height || height <= 0 || !this.mesh) return;
			this.updateHeight(height);
		});
	}

	private updateRadius(radius: number) {
		this.#radius = radius;
		this.updateGeometry();
	}

	private updateHeight(height: number) {
		this.#height = height;
		this.mesh.position.y = height / 2;
		this.updateGeometry();
	}

	private updateGeometry() {
		const geometry = new CylinderGeometry(
			this.#radius,
			this.#radius,
			this.#height,
			this.#radialSegments,
			1,
			true,
		);
		const bvh = new MeshBVH(geometry);

		this.mesh.geometry.dispose();
		this.mesh.geometry = geometry;
		ensureUV(this.mesh.geometry);
		this.mesh.geometry.boundsTree = bvh;
		this.computeBoundingBox();
	}

	dispose() {
		if (this.$liveTestCylinderInnerDiameter) {
			this.$liveTestCylinderInnerDiameter.unsubscribe();
			this.$liveTestCylinderInnerDiameter = null;
		}
		if (this.$liveTestCylinderHeight) {
			this.$liveTestCylinderHeight.unsubscribe();
			this.$liveTestCylinderHeight = null;
		}
		if (this.mesh) {
			(this.mesh.material as MeshStandardMaterial).dispose();
			this.mesh.geometry.dispose();
		}
	}

	static async create(): Promise<TestCylinder> {
		const instance = new TestCylinder();

		// Fetch dimensions + radial segment count from IndexedDB, fall back if invalid.
		const [heightDb, diameterDb, radialSegments] = await Promise.all([
			getTestCylinderHeight(),
			getTestCylinderInnerDiameter(),
			getRadialSegments(),
		]);

		const height = heightDb ? heightDb : 50;
		const diameter = diameterDb ? diameterDb : 75;

		instance.#radius = diameter / 2;
		instance.#height = height;
		instance.#radialSegments = radialSegments;

		const material = new MeshStandardMaterial({
			color: 0xffffff,
			side: DoubleSide,
			wireframe: import.meta.env.DEV,
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

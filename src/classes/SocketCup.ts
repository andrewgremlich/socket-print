import { liveQuery, type Subscription } from "dexie";
import {
	DoubleSide,
	ExtrudeGeometry,
	Mesh,
	MeshStandardMaterial,
	Path,
	Shape,
} from "three";
import {
	acceleratedRaycast,
	computeBoundsTree,
	disposeBoundsTree,
	MeshBVH,
} from "three-mesh-bvh";
import { getCupSize } from "@/db/formValuesDbActions";
import { getRadialSegments } from "@/utils/getRadialSegments";
import { AppObject } from "./AppObject";

export class SocketCup extends AppObject {
	radius = 78 / 2;
	height = 25;
	wallThickness = 5;
	radialSegments = 128;
	tubularSegments = 128;
	bumpDangerZone = 1;
	$liveCupSize: Subscription;

	private constructor() {
		super();

		this.$liveCupSize = liveQuery(() => getCupSize()).subscribe((result) => {
			if (!result) return;

			const [width, height] = result.split("x").map(Number);

			if (
				Number.isNaN(width) ||
				Number.isNaN(height) ||
				width <= 0 ||
				height <= 0
			)
				return;

			this.updateSize(width / 2, height);
		});
	}

	private createGeometry(radius: number, height: number) {
		const thickness = this.wallThickness;

		const shape = new Shape();
		shape.absarc(0, 0, radius, 0, Math.PI * 2, false);

		const hole = new Path();
		hole.absarc(0, 0, radius - thickness, 0, Math.PI * 2, true);
		shape.holes.push(hole);

		const geometry = new ExtrudeGeometry(shape, {
			depth: height,
			steps: this.tubularSegments,
			bevelEnabled: false,
		});

		// Match your original TubeGeometry orientation
		geometry.rotateX(Math.PI / 2);
		geometry.translate(0, -this.bumpDangerZone, 0);

		return geometry;
	}

	private updateSize(radius: number, height: number) {
		if (!this.mesh) return;

		this.radius = radius;
		this.height = height;

		const geometry = this.createGeometry(radius, height);
		const bvh = new MeshBVH(geometry);

		this.mesh.geometry.dispose();
		this.mesh.geometry = geometry;
		this.mesh.geometry.computeBoundsTree = computeBoundsTree;
		this.mesh.geometry.disposeBoundsTree = disposeBoundsTree;
		this.mesh.geometry.boundsTree = bvh;
	}

	dispose() {
		if (this.$liveCupSize) {
			this.$liveCupSize.unsubscribe();
			this.$liveCupSize = null;
		}
		if (this.mesh) {
			this.mesh.geometry.dispose();
		}
	}

	static async create() {
		const instance = new SocketCup();

		const [radialSegments, cupSize] = await Promise.all([
			getRadialSegments(),
			getCupSize(),
		]);
		const [width, height] = cupSize ? cupSize.split("x").map(Number) : [78, 25];

		if (
			Number.isNaN(width) ||
			Number.isNaN(height) ||
			width <= 0 ||
			height <= 0
		) {
			instance.radius = 78 / 2;
			instance.height = 25;
		} else {
			instance.radius = width / 2;
			instance.height = height;
		}
		instance.radialSegments = radialSegments;

		const material = new MeshStandardMaterial({
			color: 0xb1314d,
			side: DoubleSide,
			wireframe: import.meta.env.DEV,
		});
		const geometry = instance.createGeometry(instance.radius, instance.height);
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

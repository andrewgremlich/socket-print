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
	innerRadius = 78 / 2;
	outerRadius = 78 / 2 + 5;
	height = 25;
	radialSegments = 128;
	tubularSegments = 128;
	bumpDangerZone = 1;
	$liveCupSize: Subscription;

	private constructor() {
		super();

		this.$liveCupSize = liveQuery(() => getCupSize()).subscribe((result) => {
			if (!result) return;

			const { innerDiameter, outerDiameter, height } = result;

			if (
				Number.isNaN(innerDiameter) ||
				Number.isNaN(outerDiameter) ||
				Number.isNaN(height) ||
				innerDiameter <= 0 ||
				outerDiameter <= 0 ||
				height <= 0
			)
				return;

			this.updateSize(innerDiameter / 2, outerDiameter / 2, height);
		});
	}

	private createGeometry(
		innerRadius: number,
		outerRadius: number,
		height: number,
	) {
		const shape = new Shape();
		shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);

		const hole = new Path();
		hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
		shape.holes.push(hole);

		const geometry = new ExtrudeGeometry(shape, {
			depth: height,
			steps: this.tubularSegments,
			bevelEnabled: false,
		});

		geometry.rotateX(Math.PI / 2);
		geometry.translate(0, -this.bumpDangerZone, 0);

		return geometry;
	}

	private updateSize(innerRadius: number, outerRadius: number, height: number) {
		if (!this.mesh) return;

		this.innerRadius = innerRadius;
		this.outerRadius = outerRadius;
		this.height = height;

		const geometry = this.createGeometry(innerRadius, outerRadius, height);
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

		if (!cupSize) {
			instance.innerRadius = 78 / 2;
			instance.outerRadius = 78 / 2 + 5;
			instance.height = 25;
		} else {
			const { innerDiameter, outerDiameter, height } = cupSize;

			if (
				Number.isNaN(innerDiameter) ||
				Number.isNaN(outerDiameter) ||
				Number.isNaN(height) ||
				innerDiameter <= 0 ||
				outerDiameter <= 0 ||
				height <= 0
			) {
				instance.innerRadius = 78 / 2;
				instance.outerRadius = 78 / 2 + 5;
				instance.height = 25;
			} else {
				instance.innerRadius = innerDiameter / 2;
				instance.outerRadius = outerDiameter / 2;
				instance.height = height;
			}
		}
		instance.radialSegments = radialSegments;

		const material = new MeshStandardMaterial({
			color: 0xb1314d,
			side: DoubleSide,
			wireframe: import.meta.env.DEV,
		});
		const geometry = instance.createGeometry(
			instance.innerRadius,
			instance.outerRadius,
			instance.height,
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

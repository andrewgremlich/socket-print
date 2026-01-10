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
import { getCupSize } from "@/db/formValuesDbActions";
import { getRadialSegments } from "@/utils/getRadialSegments";
import { getCupSizeSelect } from "@/utils/htmlElements";
import { AppObject } from "./AppObject";

export class Tube extends AppObject {
	radius = 78 / 2;
	height = 25;
	radialSegments = 128;
	tubularSegments = 128;
	bumpDangerZone = 1;
	private eventListener: ((evt: Event) => void) | null = null;

	private constructor() {
		super();

		this.eventListener = (evt) => {
			const value = (evt.target as HTMLSelectElement).value;
			const parts = value.split("x");

			if (parts.length !== 2) return;

			const [width, height] = parts.map(Number);

			if (
				Number.isNaN(width) ||
				Number.isNaN(height) ||
				width <= 0 ||
				height <= 0
			)
				return;

			this.updateSize(width / 2, height);
		};

		getCupSizeSelect.addEventListener("change", this.eventListener);
	}

	private createGeometry(radius: number, height: number) {
		const path = new LineCurve3(
			new Vector3(0, -1, 0),
			new Vector3(0, -height - this.bumpDangerZone, 0),
		);
		return new TubeGeometry(
			path,
			this.radialSegments,
			radius,
			this.tubularSegments,
			false,
		);
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
		if (this.eventListener) {
			getCupSizeSelect.removeEventListener("change", this.eventListener);
			this.eventListener = null;
		}
		if (this.mesh) {
			this.mesh.geometry.dispose();
		}
	}

	static async create() {
		const instance = new Tube();

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

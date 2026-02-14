import { liveQuery, type Subscription } from "dexie";
import { cos, pi, sin, sqrt } from "mathjs";
import {
	BufferGeometry,
	DoubleSide,
	Float32BufferAttribute,
	Mesh,
	MeshStandardMaterial,
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
	taperRatio = 0.85; // Base radius is 85% of top radius
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
		// Create a tapered cup (frustum) - wider at top, narrower at base
		const segments = this.radialSegments;
		const rings = this.tubularSegments;

		const positions: number[] = [];
		const normals: number[] = [];
		const indices: number[] = [];

		// Top radii (wider)
		const outerRadiusTop = outerRadius;
		const innerRadiusTop = innerRadius;

		// Bottom radii (narrower based on taper ratio)
		const outerRadiusBottom = outerRadius * this.taperRatio;
		const innerRadiusBottom = innerRadius * this.taperRatio;

		// Generate vertices for the outer surface
		for (let ring = 0; ring <= rings; ring++) {
			const t = ring / rings;
			const y = -t * height; // Goes from 0 (top) to -height (bottom)
			const currentOuterRadius =
				outerRadiusTop + t * (outerRadiusBottom - outerRadiusTop);

			for (let seg = 0; seg <= segments; seg++) {
				const theta = (seg / segments) * pi * 2;
				const x = cos(theta) * currentOuterRadius;
				const z = sin(theta) * currentOuterRadius;

				positions.push(x, y - this.bumpDangerZone, z);

				// Calculate normal for tapered surface
				const slope = (outerRadiusTop - outerRadiusBottom) / height;
				const nx = Number(cos(theta));
				const ny = slope;
				const nz = Number(sin(theta));
				const len = Number(sqrt(nx * nx + ny * ny + nz * nz));
				normals.push(nx / len, ny / len, nz / len);
			}
		}

		const outerVertexCount = (rings + 1) * (segments + 1);

		// Generate vertices for the inner surface
		for (let ring = 0; ring <= rings; ring++) {
			const t = ring / rings;
			const y = -t * height;
			const currentInnerRadius =
				innerRadiusTop + t * (innerRadiusBottom - innerRadiusTop);

			for (let seg = 0; seg <= segments; seg++) {
				const theta = (seg / segments) * pi * 2;
				const x = cos(theta) * currentInnerRadius;
				const z = sin(theta) * currentInnerRadius;

				positions.push(x, y - this.bumpDangerZone, z);

				// Normal points inward
				const slope = (innerRadiusTop - innerRadiusBottom) / height;
				const nx = -Number(cos(theta));
				const ny = -slope;
				const nz = -Number(sin(theta));
				const len = Number(sqrt(nx * nx + ny * ny + nz * nz));
				normals.push(nx / len, ny / len, nz / len);
			}
		}

		// Generate indices for outer surface
		for (let ring = 0; ring < rings; ring++) {
			for (let seg = 0; seg < segments; seg++) {
				const a = ring * (segments + 1) + seg;
				const b = a + segments + 1;
				const c = a + 1;
				const d = b + 1;

				indices.push(a, b, c);
				indices.push(c, b, d);
			}
		}

		// Generate indices for inner surface (reversed winding)
		for (let ring = 0; ring < rings; ring++) {
			for (let seg = 0; seg < segments; seg++) {
				const a = outerVertexCount + ring * (segments + 1) + seg;
				const b = a + segments + 1;
				const c = a + 1;
				const d = b + 1;

				indices.push(a, c, b);
				indices.push(c, d, b);
			}
		}

		// Add top ring (cap between inner and outer at top)
		const topOuterStart = 0;
		const topInnerStart = outerVertexCount;
		for (let seg = 0; seg < segments; seg++) {
			const outerA = topOuterStart + seg;
			const outerB = topOuterStart + seg + 1;
			const innerA = topInnerStart + seg;
			const innerB = topInnerStart + seg + 1;

			indices.push(outerA, innerA, outerB);
			indices.push(outerB, innerA, innerB);
		}

		// Add bottom ring (cap between inner and outer at bottom)
		const bottomOuterStart = rings * (segments + 1);
		const bottomInnerStart = outerVertexCount + rings * (segments + 1);
		for (let seg = 0; seg < segments; seg++) {
			const outerA = bottomOuterStart + seg;
			const outerB = bottomOuterStart + seg + 1;
			const innerA = bottomInnerStart + seg;
			const innerB = bottomInnerStart + seg + 1;

			indices.push(outerA, outerB, innerA);
			indices.push(outerB, innerB, innerA);
		}

		const geometry = new BufferGeometry();
		geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
		geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
		geometry.setIndex(indices);
		geometry.computeVertexNormals();

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
		instance.mesh.userData = { isSocketCup: true };
		instance.mesh.raycast = acceleratedRaycast;
		instance.mesh.geometry.computeBoundsTree = computeBoundsTree;
		instance.mesh.geometry.disposeBoundsTree = disposeBoundsTree;
		instance.mesh.geometry.boundsTree = bvh;

		return instance;
	}
}

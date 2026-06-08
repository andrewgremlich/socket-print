import { liveQuery, type Subscription } from "dexie";
import { cos, floor, pi, sin } from "mathjs";
import {
	BufferGeometry,
	Color,
	DoubleSide,
	Float32BufferAttribute,
	Mesh,
	MeshStandardMaterial,
	Raycaster,
	type Scene,
	Vector3,
} from "three";
import {
	acceleratedRaycast,
	computeBoundsTree,
	disposeBoundsTree,
	MeshBVH,
} from "three-mesh-bvh";
import { getTestCylinderInnerDiameter } from "@/db/appSettingsDbActions";
import { getNozzleSize } from "@/db/formValuesDbActions";
import { getActiveMaterialProfileShrinkFactor } from "@/db/materialProfilesDbActions";
import { NOZZLE_SIZE_OFFSET_FACTOR } from "@/utils/constants";
import { getRadialSegments } from "@/utils/getRadialSegments";
import { AppObject } from "./AppObject";
import type { SocketCup } from "./SocketCup";

const COLOR_HIT = new Color(0x4a90d9);
const COLOR_MISS = new Color(0xff0000);

type TransitionResult = {
	isValid: boolean;
	geometry?: BufferGeometry;
	intersectionPoints?: Vector3[];
};

export class CupToSocketTransition extends AppObject {
	#socketCup: SocketCup;
	#socketMesh: Mesh;
	#scene: Scene;
	#segments: number;
	#isValidFit = false;
	#intersectionPoints: Vector3[] = [];
	#bottomRingPoints: Vector3[] = [];
	#lastDiameter: number | null = null;
	#onRecompute: (() => void) | null = null;
	$liveTestCylinderDiameter: Subscription | null = null;

	private constructor(
		socketCup: SocketCup,
		socketMesh: Mesh,
		scene: Scene,
		segments: number,
	) {
		super();
		this.#socketCup = socketCup;
		this.#socketMesh = socketMesh;
		this.#scene = scene;
		this.#segments = segments;
	}

	static async create(
		socketCup: SocketCup,
		socketMesh: Mesh,
		scene: Scene,
	): Promise<CupToSocketTransition> {
		const segments = await getRadialSegments();
		const instance = new CupToSocketTransition(
			socketCup,
			socketMesh,
			scene,
			segments,
		);
		instance.#setupSubscriptions();
		return instance;
	}

	#setupSubscriptions(): void {
		this.$liveTestCylinderDiameter = liveQuery(() =>
			getTestCylinderInnerDiameter(),
		).subscribe((diameter) => {
			if (!diameter || diameter <= 0) return;
			if (diameter === this.#lastDiameter) return;
			this.#lastDiameter = diameter;
			this.recompute().then(() => this.#onRecompute?.());
		});
	}

	#ensureMesh(): void {
		if (this.mesh) return;

		const geometry = new BufferGeometry();
		const material = new MeshStandardMaterial({
			color: 0xffffff,
			side: DoubleSide,
			vertexColors: true,
		});

		this.mesh = new Mesh(geometry, material);
		this.mesh.name = "cup-to-socket-transition";
		this.mesh.userData = { isTransition: true };
		this.mesh.raycast = acceleratedRaycast;
		this.mesh.geometry.computeBoundsTree = computeBoundsTree;
		this.mesh.geometry.disposeBoundsTree = disposeBoundsTree;

		this.#scene.add(this.mesh);
	}

	#updateGeometry(topRing: Vector3[], hitMask: boolean[]): void {
		const positions: number[] = [];
		const normals: number[] = [];
		const colors: number[] = [];
		const indices: number[] = [];
		const segments = this.#segments;

		const pushColor = (hit: boolean) => {
			const c = hit ? COLOR_HIT : COLOR_MISS;
			colors.push(c.r, c.g, c.b);
		};

		for (let i = 0; i <= segments; i++) {
			const ringIdx = i % segments;
			const point = this.#bottomRingPoints[ringIdx];
			positions.push(point.x, point.y, point.z);
			const len = Math.sqrt(point.x * point.x + point.z * point.z);
			normals.push(point.x / len, 0, point.z / len);
			pushColor(hitMask[ringIdx]);
		}

		for (let i = 0; i <= segments; i++) {
			const ringIdx = i % segments;
			const point = topRing[ringIdx];
			positions.push(point.x, point.y, point.z);
			const len = Math.sqrt(point.x * point.x + point.z * point.z);
			normals.push(point.x / len, 0, point.z / len);
			pushColor(hitMask[ringIdx]);
		}

		const topStart = segments + 1;
		for (let i = 0; i < segments; i++) {
			const bA = i;
			const bB = i + 1;
			const tA = topStart + i;
			const tB = topStart + i + 1;
			indices.push(bA, bB, tA);
			indices.push(tA, bB, tB);
		}

		const geo = this.mesh.geometry;
		geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
		geo.setAttribute("normal", new Float32BufferAttribute(normals, 3));
		geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
		geo.setIndex(indices);
		geo.computeVertexNormals();

		geo.boundsTree = new MeshBVH(geo);
	}

	async computeTransition(): Promise<TransitionResult> {
		const shrinkFactor = await getActiveMaterialProfileShrinkFactor();
		const nozzleSize = await getNozzleSize();
		const testCylinderDiameter = await getTestCylinderInnerDiameter();
		const shrinkScale = floor(1 / (1 - shrinkFactor / 100), 4);
		const nozzleSizeOffset = nozzleSize / NOZZLE_SIZE_OFFSET_FACTOR;

		const testCylinderRadius = (testCylinderDiameter ?? 75) / 2;
		const transformedRadius =
			testCylinderRadius * shrinkScale + nozzleSizeOffset;

		const cupTopY = -this.#socketCup.bumpDangerZone;

		const raycaster = new Raycaster();
		raycaster.firstHitOnly = false;

		this.#socketMesh.updateMatrixWorld(true);
		this.#intersectionPoints = [];
		this.#bottomRingPoints = [];

		const rayResults: { origin: Vector3; point: Vector3 | null }[] = [];

		for (let i = 0; i < this.#segments; i++) {
			const theta = (i / this.#segments) * pi * 2;
			const x = Number(cos(theta)) * transformedRadius;
			const z = Number(sin(theta)) * transformedRadius;

			const origin = new Vector3(x, cupTopY, z);
			this.#bottomRingPoints.push(origin);

			raycaster.ray.origin.set(x, cupTopY, z);
			raycaster.ray.direction.set(0, 1, 0);

			const intersects = raycaster.intersectObject(this.#socketMesh, false);
			rayResults.push({
				origin,
				point: intersects.length > 0 ? intersects[0].point.clone() : null,
			});
		}

		const hitMask = rayResults.map((r) => r.point !== null);
		const allHit = hitMask.every((h) => h);

		this.#ensureMesh();
		const material = this.mesh.material as MeshStandardMaterial;
		material.wireframe = false;
		this.mesh.visible = true;

		const topRing = this.#buildTopRing(rayResults, hitMask);

		if (allHit) {
			for (const r of rayResults) {
				// biome-ignore lint/style/noNonNullAssertion: allHit guarantees point is set
				this.#intersectionPoints.push(r.point!);
			}
			this.#updateGeometry(this.#intersectionPoints, hitMask);
			this.#isValidFit = true;
			return {
				isValid: true,
				geometry: this.mesh.geometry,
				intersectionPoints: this.#intersectionPoints,
			};
		}

		this.#updateGeometry(topRing, hitMask);
		this.#isValidFit = false;
		return { isValid: false };
	}

	/**
	 * Build the top ring for visualization. Hits use their intersection point.
	 * Misses inherit Y from the nearest hit neighbor on the ring so the band
	 * stays continuous and red verts sit on the same surface as blue ones.
	 * Falls back to bottom-ring Y when no rays hit at all.
	 */
	#buildTopRing(
		rayResults: { origin: Vector3; point: Vector3 | null }[],
		hitMask: boolean[],
	): Vector3[] {
		const segments = this.#segments;
		const result: Vector3[] = new Array(segments);
		const yValues: (number | null)[] = rayResults.map((r) =>
			r.point ? r.point.y : null,
		);

		const findNearestHitY = (i: number): number | null => {
			for (let d = 1; d <= segments / 2; d++) {
				const left = yValues[(i - d + segments) % segments];
				if (left !== null) return left;
				const right = yValues[(i + d) % segments];
				if (right !== null) return right;
			}
			return null;
		};

		for (let i = 0; i < segments; i++) {
			const origin = rayResults[i].origin;
			if (hitMask[i]) {
				// biome-ignore lint/style/noNonNullAssertion: hitMask guards .point
				result[i] = rayResults[i].point!.clone();
			} else {
				const y = findNearestHitY(i) ?? origin.y;
				result[i] = new Vector3(origin.x, y, origin.z);
			}
		}
		return result;
	}

	async recompute(): Promise<TransitionResult> {
		return this.computeTransition();
	}

	setRecomputeCallback(cb: () => void): void {
		this.#onRecompute = cb;
	}

	isValidFit(): boolean {
		return this.#isValidFit;
	}

	getIntersectionPoints(): Vector3[] {
		return this.#intersectionPoints;
	}

	getBottomRingPoints(): Vector3[] {
		return this.#bottomRingPoints;
	}

	getTransitionGeometry(): BufferGeometry | null {
		return this.mesh?.geometry ?? null;
	}

	dispose(): void {
		if (this.$liveTestCylinderDiameter) {
			this.$liveTestCylinderDiameter.unsubscribe();
			this.$liveTestCylinderDiameter = null;
		}

		if (this.mesh) {
			this.#scene.remove(this.mesh);
			this.mesh.geometry.dispose();
			if (this.mesh.material instanceof MeshStandardMaterial) {
				this.mesh.material.dispose();
			}
			this.mesh = null;
		}

		this.#intersectionPoints = [];
		this.#bottomRingPoints = [];
		this.#isValidFit = false;
	}
}

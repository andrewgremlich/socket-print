import { cos, floor, pi, sin } from "mathjs";
import {
	BufferGeometry,
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
import { getNozzleSize } from "@/db/formValuesDbActions";
import { getActiveMaterialProfileShrinkFactor } from "@/db/materialProfilesDbActions";
import { NOZZLE_SIZE_OFFSET_FACTOR } from "@/utils/constants";
import { getRadialSegments } from "@/utils/getRadialSegments";
import { AppObject } from "./AppObject";
import type { SocketCup } from "./SocketCup";

export type TransitionResult = {
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
		return instance;
	}

	async computeTransition(): Promise<TransitionResult> {
		// Get transformation parameters
		const shrinkFactor = await getActiveMaterialProfileShrinkFactor();
		const nozzleSize = await getNozzleSize();
		const shrinkScale = floor(1 / (1 - shrinkFactor / 100), 4);
		const nozzleSizeOffset = nozzleSize / NOZZLE_SIZE_OFFSET_FACTOR;

		// Calculate transformed radius using cup's outer radius
		const transformedRadius =
			this.#socketCup.outerRadius * shrinkScale + nozzleSizeOffset;

		// Cup top Y position (accounting for bump danger zone)
		const cupTopY = -this.#socketCup.bumpDangerZone;

		// Setup raycaster
		const raycaster = new Raycaster();
		raycaster.firstHitOnly = false;

		// Ensure socket mesh has updated matrices
		this.#socketMesh.updateMatrixWorld(true);

		// Clear previous points
		this.#intersectionPoints = [];
		this.#bottomRingPoints = [];

		// Cast rays from cup's top edge circumference
		for (let i = 0; i < this.#segments; i++) {
			const theta = (i / this.#segments) * pi * 2;
			const x = Number(cos(theta)) * transformedRadius;
			const z = Number(sin(theta)) * transformedRadius;

			// Store bottom ring point
			this.#bottomRingPoints.push(new Vector3(x, cupTopY, z));

			// Set ray origin at cup top edge
			raycaster.ray.origin.set(x, cupTopY, z);
			// Ray direction: straight up (positive Y)
			raycaster.ray.direction.set(0, 1, 0);

			const intersects = raycaster.intersectObject(this.#socketMesh, false);

			if (intersects.length === 0) {
				// Imperfect fit - ray missed the socket
				this.#isValidFit = false;
				return { isValid: false };
			}

			// Store the first (closest) intersection point
			this.#intersectionPoints.push(intersects[0].point.clone());
		}

		// All rays hit - valid fit
		this.#isValidFit = true;

		// Generate tapered geometry
		const geometry = this.#createTaperedGeometry();

		// Create mesh and add to scene
		this.#createMesh(geometry);

		return {
			isValid: true,
			geometry,
			intersectionPoints: this.#intersectionPoints,
		};
	}

	#createTaperedGeometry(): BufferGeometry {
		const positions: number[] = [];
		const normals: number[] = [];
		const indices: number[] = [];

		const segments = this.#segments;

		// Add bottom ring vertices (from cup's top edge)
		for (let i = 0; i <= segments; i++) {
			const idx = i % segments;
			const point = this.#bottomRingPoints[idx];
			positions.push(point.x, point.y, point.z);

			// Normal points outward (approximation for bottom ring)
			const nx = point.x;
			const nz = point.z;
			const len = Math.sqrt(nx * nx + nz * nz);
			normals.push(nx / len, 0, nz / len);
		}

		// Add top ring vertices (from intersection points)
		for (let i = 0; i <= segments; i++) {
			const idx = i % segments;
			const point = this.#intersectionPoints[idx];
			positions.push(point.x, point.y, point.z);

			// Normal points outward (approximation for top ring)
			const nx = point.x;
			const nz = point.z;
			const len = Math.sqrt(nx * nx + nz * nz);
			normals.push(nx / len, 0, nz / len);
		}

		// Create triangles connecting bottom ring to top ring
		const bottomStart = 0;
		const topStart = segments + 1;

		for (let i = 0; i < segments; i++) {
			const bottomA = bottomStart + i;
			const bottomB = bottomStart + i + 1;
			const topA = topStart + i;
			const topB = topStart + i + 1;

			// Two triangles per quad
			// Triangle 1: bottomA -> bottomB -> topA
			indices.push(bottomA, bottomB, topA);
			// Triangle 2: topA -> bottomB -> topB
			indices.push(topA, bottomB, topB);
		}

		const geometry = new BufferGeometry();
		geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
		geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
		geometry.setIndex(indices);
		geometry.computeVertexNormals();

		return geometry;
	}

	#createMesh(geometry: BufferGeometry): void {
		// Dispose existing mesh if any
		if (this.mesh) {
			this.#scene.remove(this.mesh);
			this.mesh.geometry.dispose();
			if (this.mesh.material instanceof MeshStandardMaterial) {
				this.mesh.material.dispose();
			}
		}

		const material = new MeshStandardMaterial({
			color: 0x4a90d9, // Blue-ish color to distinguish from cup and socket
			side: DoubleSide,
			wireframe: import.meta.env.DEV,
		});

		this.mesh = new Mesh(geometry, material);
		this.mesh.name = "cup-to-socket-transition";
		this.mesh.userData = { isTransition: true };

		// Setup BVH for ray casting
		const bvh = new MeshBVH(geometry);
		this.mesh.raycast = acceleratedRaycast;
		this.mesh.geometry.computeBoundsTree = computeBoundsTree;
		this.mesh.geometry.disposeBoundsTree = disposeBoundsTree;
		this.mesh.geometry.boundsTree = bvh;

		// Add to scene
		this.#scene.add(this.mesh);
	}

	async recompute(): Promise<TransitionResult> {
		return this.computeTransition();
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
		if (this.mesh) {
			this.#scene.remove(this.mesh);

			if (this.mesh.geometry) {
				this.mesh.geometry.dispose();
			}

			if (this.mesh.material instanceof MeshStandardMaterial) {
				this.mesh.material.dispose();
			}
		}

		this.#intersectionPoints = [];
		this.#bottomRingPoints = [];
		this.#isValidFit = false;
	}
}

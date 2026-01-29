import {
	BufferAttribute,
	Mesh,
	MeshBasicMaterial,
	type PerspectiveCamera,
	Raycaster,
	type Scene,
	SphereGeometry,
	Vector2,
	Vector3,
} from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
	getTrimLinePoints,
	setTrimLinePoints,
	type TrimLinePoint,
} from "@/db/trimLineDbActions";

const TRIM_LINE_POINT_COLOR = 0xff0000;
const SHADED_REGION_COLOR = 0x333333;
const SHADED_REGION_OPACITY = 0.5;
const POINT_SPHERE_RADIUS = 1;
const INTERPOLATION_DISTANCE_MM = 1;

export class TrimLine {
	private drawnPoints: Vector3[] = [];
	private interpolatedPoints: Vector3[] = [];
	private pointMeshes: Mesh[] = [];
	private shadedRegionMesh: Mesh | null = null;
	private isDrawingMode = false;
	private scene: Scene;
	private camera: PerspectiveCamera;
	private canvas: HTMLCanvasElement;
	private raycaster: Raycaster;
	private targetMesh: Mesh | null = null;
	private controls: OrbitControls;
	private onDrawingStateChange: ((isDrawing: boolean) => void) | null = null;
	private onPointsChange: ((points: Vector3[]) => void) | null = null;

	private boundHandlePointerDown: (event: PointerEvent) => void;

	constructor(
		scene: Scene,
		camera: PerspectiveCamera,
		canvas: HTMLCanvasElement,
		controls: OrbitControls,
	) {
		this.scene = scene;
		this.camera = camera;
		this.canvas = canvas;
		this.controls = controls;
		this.raycaster = new Raycaster();

		this.boundHandlePointerDown = this.handlePointerDown.bind(this);
	}

	setOnDrawingStateChange(callback: (isDrawing: boolean) => void): void {
		this.onDrawingStateChange = callback;
	}

	setOnPointsChange(callback: (points: Vector3[]) => void): void {
		this.onPointsChange = callback;
	}

	async loadFromDatabase(): Promise<void> {
		const savedPoints = await getTrimLinePoints();
		if (savedPoints.length > 0) {
			// Saved points are the interpolated points
			this.interpolatedPoints = savedPoints.map(
				(p: TrimLinePoint) => new Vector3(p.x, p.y, p.z),
			);
			this.updateVisualization();
			this.updateShadedRegion();
			this.onPointsChange?.(this.interpolatedPoints);
		}
	}

	enableDrawingMode(targetMesh: Mesh): void {
		if (this.isDrawingMode) return;

		this.targetMesh = targetMesh;
		this.isDrawingMode = true;
		this.controls.enabled = false;

		this.canvas.addEventListener("pointerdown", this.boundHandlePointerDown);
		this.canvas.style.cursor = "crosshair";

		this.onDrawingStateChange?.(true);
	}

	disableDrawingMode(): void {
		if (!this.isDrawingMode) return;

		this.isDrawingMode = false;
		this.controls.enabled = true;

		this.canvas.removeEventListener("pointerdown", this.boundHandlePointerDown);
		this.canvas.style.cursor = "default";

		this.onDrawingStateChange?.(false);
	}

	async finishDrawing(): Promise<void> {
		this.disableDrawingMode();

		if (this.drawnPoints.length >= 2) {
			// Interpolate points between drawn points
			this.interpolatedPoints = this.interpolatePoints(this.drawnPoints);
			await setTrimLinePoints(this.interpolatedPoints);
			this.updateVisualization();
			this.updateShadedRegion();
		}

		this.onPointsChange?.(this.interpolatedPoints);
	}

	private interpolatePoints(points: Vector3[]): Vector3[] {
		if (points.length < 2) return [...points];

		const result: Vector3[] = [];

		for (let i = 0; i < points.length; i++) {
			const currentPoint = points[i];
			const nextPoint = points[(i + 1) % points.length];

			// Always add the current drawn point
			result.push(currentPoint.clone());

			// Calculate distance between current and next point
			const distance = currentPoint.distanceTo(nextPoint);

			// If distance is greater than interpolation distance, add intermediate points
			if (distance > INTERPOLATION_DISTANCE_MM) {
				const numIntermediatePoints = Math.floor(
					distance / INTERPOLATION_DISTANCE_MM,
				);

				for (let j = 1; j < numIntermediatePoints; j++) {
					const t = j / numIntermediatePoints;
					const interpolated = new Vector3().lerpVectors(
						currentPoint,
						nextPoint,
						t,
					);
					result.push(interpolated);
				}
			}
		}

		return result;
	}

	private handlePointerDown(event: PointerEvent): void {
		if (!this.isDrawingMode || !this.targetMesh) return;

		const rect = this.canvas.getBoundingClientRect();
		const mouse = new Vector2(
			((event.clientX - rect.left) / rect.width) * 2 - 1,
			-((event.clientY - rect.top) / rect.height) * 2 + 1,
		);

		this.raycaster.setFromCamera(mouse, this.camera);
		const intersects = this.raycaster.intersectObject(this.targetMesh, true);

		if (intersects.length > 0) {
			const point = intersects[0].point.clone();
			this.addPoint(point);
		}
	}

	private addPoint(point: Vector3): void {
		this.drawnPoints.push(point);
		this.updateVisualization();
		this.onPointsChange?.(this.drawnPoints);
	}

	async clear(): Promise<void> {
		this.drawnPoints = [];
		this.interpolatedPoints = [];
		this.disableDrawingMode();
		this.removeVisualization();
		this.removeShadedRegion();
		await setTrimLinePoints([]);
		this.onPointsChange?.(this.interpolatedPoints);
	}

	private updateVisualization(): void {
		this.removeVisualization();

		// Show drawn points during drawing, interpolated points after finishing
		const pointsToShow = this.isDrawingMode
			? this.drawnPoints
			: this.interpolatedPoints;

		if (pointsToShow.length === 0) return;

		// Create point spheres for each vertex
		const pointMaterial = new MeshBasicMaterial({
			color: TRIM_LINE_POINT_COLOR,
		});
		for (const point of pointsToShow) {
			const sphereGeometry = new SphereGeometry(POINT_SPHERE_RADIUS, 8, 8);
			const sphereMesh = new Mesh(sphereGeometry, pointMaterial);
			sphereMesh.position.copy(point);
			sphereMesh.userData.isTrimLinePoint = true;
			this.scene.add(sphereMesh);
			this.pointMeshes.push(sphereMesh);
		}
	}

	private removeVisualization(): void {
		for (const mesh of this.pointMeshes) {
			this.scene.remove(mesh);
			mesh.geometry.dispose();
			(mesh.material as MeshBasicMaterial).dispose();
		}
		this.pointMeshes = [];
	}

	private updateShadedRegion(): void {
		this.removeShadedRegion();

		if (this.interpolatedPoints.length < 2 || !this.targetMesh) return;

		// Clone the target mesh geometry and create a shaded overlay
		// for vertices that are above the trim line
		const originalGeometry = this.targetMesh.geometry.clone();
		const positions = originalGeometry.attributes.position;
		const vertexCount = positions.count;

		// Create vertex colors - darken vertices above trim line
		const colors = new Float32Array(vertexCount * 3);

		for (let i = 0; i < vertexCount; i++) {
			const x = positions.getX(i);
			const y = positions.getY(i);
			const z = positions.getZ(i);

			// Transform vertex to world space
			const worldVertex = new Vector3(x, y, z);
			worldVertex.applyMatrix4(this.targetMesh.matrixWorld);

			const isAbove = this.isPointAboveTrimLine(worldVertex);

			if (isAbove) {
				// Darker color for vertices above trim line (will not be printed)
				colors[i * 3] = SHADED_REGION_COLOR / 0xffffff;
				colors[i * 3 + 1] = SHADED_REGION_COLOR / 0xffffff;
				colors[i * 3 + 2] = SHADED_REGION_COLOR / 0xffffff;
			} else {
				// Original color (white/light) for printable region
				colors[i * 3] = 1;
				colors[i * 3 + 1] = 1;
				colors[i * 3 + 2] = 1;
			}
		}

		originalGeometry.setAttribute("color", new BufferAttribute(colors, 3));

		const material = new MeshBasicMaterial({
			vertexColors: true,
			transparent: true,
			opacity: SHADED_REGION_OPACITY,
			depthWrite: false,
		});

		this.shadedRegionMesh = new Mesh(originalGeometry, material);
		this.shadedRegionMesh.userData.isTrimLineShading = true;

		// Copy the transform from the target mesh
		this.shadedRegionMesh.position.copy(this.targetMesh.position);
		this.shadedRegionMesh.rotation.copy(this.targetMesh.rotation);
		this.shadedRegionMesh.scale.copy(this.targetMesh.scale);

		this.scene.add(this.shadedRegionMesh);
	}

	private removeShadedRegion(): void {
		if (this.shadedRegionMesh) {
			this.scene.remove(this.shadedRegionMesh);
			this.shadedRegionMesh.geometry.dispose();
			(this.shadedRegionMesh.material as MeshBasicMaterial).dispose();
			this.shadedRegionMesh = null;
		}
	}

	isPointAboveTrimLine(point: Vector3): boolean {
		if (this.interpolatedPoints.length < 2) return false;

		// Calculate the angle of the point in the XZ plane
		const pointAngle = Math.atan2(point.z, point.x);

		// Find the trim line height at this angle by interpolating between trim points
		const trimHeight = this.interpolateHeightAtAngle(pointAngle);

		// Point is "above" if its Y is greater than the trim line height at that angle
		return point.y > trimHeight;
	}

	private interpolateHeightAtAngle(targetAngle: number): number {
		if (this.interpolatedPoints.length === 0) return Number.POSITIVE_INFINITY;
		if (this.interpolatedPoints.length === 1)
			return this.interpolatedPoints[0].y;

		// Convert all trim points to angle/height pairs
		const angleHeightPairs = this.interpolatedPoints.map((p) => ({
			angle: Math.atan2(p.z, p.x),
			height: p.y,
		}));

		// Sort by angle
		angleHeightPairs.sort(
			(a: { angle: number }, b: { angle: number }) => a.angle - b.angle,
		);

		// Normalize target angle to [-PI, PI]
		let normalizedTarget = targetAngle;
		while (normalizedTarget > Math.PI) normalizedTarget -= 2 * Math.PI;
		while (normalizedTarget < -Math.PI) normalizedTarget += 2 * Math.PI;

		// Find the two adjacent points for interpolation
		let lowerIdx = -1;
		let upperIdx = -1;

		for (let i = 0; i < angleHeightPairs.length; i++) {
			if (angleHeightPairs[i].angle <= normalizedTarget) {
				lowerIdx = i;
			}
			if (angleHeightPairs[i].angle >= normalizedTarget && upperIdx === -1) {
				upperIdx = i;
			}
		}

		// Handle edge cases (wrap around)
		if (lowerIdx === -1) lowerIdx = angleHeightPairs.length - 1;
		if (upperIdx === -1) upperIdx = 0;

		const lower = angleHeightPairs[lowerIdx];
		const upper = angleHeightPairs[upperIdx];

		// If same point or same angle, return that height
		if (lowerIdx === upperIdx || lower.angle === upper.angle) {
			return lower.height;
		}

		// Linear interpolation
		let angleDiff = upper.angle - lower.angle;
		let angleOffset = normalizedTarget - lower.angle;

		// Handle wrap-around
		if (angleDiff < 0) angleDiff += 2 * Math.PI;
		if (angleOffset < 0) angleOffset += 2 * Math.PI;

		const t = angleDiff !== 0 ? angleOffset / angleDiff : 0;
		return lower.height + t * (upper.height - lower.height);
	}

	getPoints(): Vector3[] {
		return [...this.interpolatedPoints];
	}

	hasPoints(): boolean {
		return this.interpolatedPoints.length > 0 || this.drawnPoints.length > 0;
	}

	isDrawing(): boolean {
		return this.isDrawingMode;
	}

	setTargetMesh(mesh: Mesh | null): void {
		this.targetMesh = mesh;
	}

	dispose(): void {
		this.disableDrawingMode();
		this.removeVisualization();
		this.removeShadedRegion();
		this.drawnPoints = [];
		this.interpolatedPoints = [];
		this.targetMesh = null;
	}
}

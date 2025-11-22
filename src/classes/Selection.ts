import * as THREE from "three";

/** Abstract class representing a selection using a pointer. */
export abstract class Selection {
	dragging: boolean;
	protected prevX: number = 0;
	protected prevY: number = 0;

	constructor() {
		this.dragging = false;
	}

	handlePointerDown(e: PointerEvent | MouseEvent): void {
		this.dragging = true;
		this.prevX = e.clientX;
		this.prevY = e.clientY;
	}
	handlePointerUp(): void {
		this.dragging = false;
	}
	abstract handlePointerMove(e: PointerEvent | MouseEvent): {
		changed: boolean;
	};
	abstract get points(): number[];

	/** Convert absolute screen coordinates `x` and `y` to relative coordinates in range [-1; 1]. */
	static normalizePoint(x: number, y: number): [number, number] {
		return [
			(x / window.innerWidth) * 2 - 1,
			-((y / window.innerHeight) * 2 - 1),
		];
	}
}

const tempVec0 = new THREE.Vector2();
const tempVec1 = new THREE.Vector2();
const tempVec2 = new THREE.Vector2();
/** Selection that adds points on drag and connects the start and end points with a straight line. */
export class LassoSelection extends Selection {
	lassoPoints: number[] = [];

	constructor() {
		super();
		this.prevX = -Infinity;
		this.prevY = -Infinity;
	}

	handlePointerDown(e: PointerEvent | MouseEvent): void {
		super.handlePointerDown(e);
		this.lassoPoints = [];
	}

	handlePointerMove(e: PointerEvent | MouseEvent): { changed: boolean } {
		const ex = e.clientX;
		const ey = e.clientY;
		const [nx, ny] = Selection.normalizePoint(ex, ey);

		if (Math.abs(ex - this.prevX) >= 3 || Math.abs(ey - this.prevY) >= 3) {
			const i = this.lassoPoints.length / 3 - 1;
			const i3 = i * 3;
			let doReplace = false;
			if (this.lassoPoints.length > 3) {
				tempVec0.set(this.lassoPoints[i3 - 3], this.lassoPoints[i3 - 3 + 1]);
				tempVec1.set(this.lassoPoints[i3], this.lassoPoints[i3 + 1]);
				tempVec1.sub(tempVec0).normalize();
				tempVec0.set(this.lassoPoints[i3], this.lassoPoints[i3 + 1]);
				tempVec2.set(nx, ny);
				tempVec2.sub(tempVec0).normalize();
				const dot = tempVec1.dot(tempVec2);
				doReplace = dot > 0.99;
			}
			if (doReplace) {
				this.lassoPoints[i3] = nx;
				this.lassoPoints[i3 + 1] = ny;
			} else {
				this.lassoPoints.push(nx, ny, 0);
			}
			this.prevX = ex;
			this.prevY = ey;
			return { changed: true };
		}
		return { changed: false };
	}

	get points(): number[] {
		return this.lassoPoints;
	}
}

export class BoxSelection extends Selection {
	startX: number = 0;
	startY: number = 0;
	currentX: number = 0;
	currentY: number = 0;

	constructor() {
		super();
	}

	handlePointerDown(e: PointerEvent | MouseEvent): void {
		super.handlePointerDown(e);
		const [nx, ny] = Selection.normalizePoint(e.clientX, e.clientY);
		this.startX = nx;
		this.startY = ny;
	}

	handlePointerMove(e: PointerEvent | MouseEvent): { changed: boolean } {
		const ex = e.clientX;
		const ey = e.clientY;
		const [nx, ny] = Selection.normalizePoint(e.clientX, e.clientY);
		this.currentX = nx;
		this.currentY = ny;
		if (ex === this.prevX && ey === this.prevY) {
			return { changed: false };
		}
		this.prevX = ex;
		this.prevY = ey;
		return { changed: true };
	}

	get points(): number[] {
		return [
			this.startX,
			this.startY,
			0,
			this.currentX,
			this.startY,
			0,
			this.currentX,
			this.currentY,
			0,
			this.startX,
			this.currentY,
			0,
		];
	}
}

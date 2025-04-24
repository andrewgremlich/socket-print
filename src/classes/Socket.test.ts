import { Vector3 } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Socket } from "@/classes/Socket";
import * as htmlElements from "@/utils/htmlElements";
import type { Box3, Matrix4, Mesh } from "three";

// Mock AppObject
vi.mock("@/classes/AppObject", () => {
	return {
		AppObject: vi.fn().mockImplementation(() => ({
			mesh: null,
			boundingBox: null,
			size: null,
			center: null,
			updateMatrixWorld: vi.fn(),
			computeBoundingBox: vi.fn().mockImplementation(function (this: {
				boundingBox: Box3;
				size: Vector3;
				center: Vector3;
			}) {
				this.boundingBox = {
					min: { x: -0.5, y: -0.5, z: -0.5 },
					max: { x: 0.5, y: 0.5, z: 0.5 },
					getSize: vi.fn().mockReturnValue(new Vector3(1, 1, 1)),
					getCenter: vi.fn().mockReturnValue(new Vector3(0, 0, 0)),
				} as unknown as Box3;
				this.size = new Vector3(1, 1, 1);
				this.center = new Vector3(0, 0, 0);
			}),
		})),
	};
});

// Mock three.js addons
vi.mock("three/examples/jsm/Addons.js", () => ({
	BufferGeometryUtils: {
		mergeBufferGeometries: vi.fn(),
	},
}));

// Mock three.js
vi.mock("three", async () => {
	const actual = await vi.importActual("three");
	return {
		...actual,
		STLLoader: vi.fn().mockImplementation(() => ({
			load: vi.fn().mockImplementation((_, onLoad) => {
				onLoad({ clone: () => ({ center: vi.fn() }) });
			}),
			parse: vi.fn().mockReturnValue({
				rotateX: vi.fn(),
				rotateY: vi.fn(),
				rotateZ: vi.fn(),
				translate: vi.fn(),
				dispose: vi.fn(),
			}),
		})),
		Mesh: vi.fn().mockImplementation(() => ({
			position: new Vector3(0, 0, 0),
			rotation: { x: 0, y: 0, z: 0 },
			scale: new Vector3(1, 1, 1),
			rotateX: vi.fn(),
			rotateY: vi.fn(),
			rotateZ: vi.fn(),
			add: vi.fn(),
			clone: vi.fn().mockReturnThis(),
			updateWorldMatrix: vi.fn(),
			updateMatrix: vi.fn(),
			geometry: {
				translate: vi.fn(),
				dispose: vi.fn(),
			},
			name: "test.stl",
		})),
		Box3: vi.fn().mockImplementation(() => ({
			setFromObject: vi.fn().mockReturnThis(),
			getSize: vi.fn().mockReturnValue(new Vector3(1, 1, 1)),
			getCenter: vi.fn().mockReturnValue(new Vector3(0, 0, 0)),
			min: { x: -0.5, y: -0.5, z: -0.5 },
			max: { x: 0.5, y: 0.5, z: 0.5 },
		})),
		MeshStandardMaterial: vi.fn(),
		DoubleSide: 2, // Actual value in THREE
		Vector3: actual.Vector3,
	};
});

// Mock dependencies
vi.mock("@/utils/htmlElements", () => ({
	stlFileInput: {
		addEventListener: vi.fn(),
	},
	coronalRotater: {
		addEventListener: vi.fn(),
	},
	sagittalRotate: {
		addEventListener: vi.fn(),
	},
	transversalRotater: {
		addEventListener: vi.fn(),
	},
	verticalTranslate: {
		addEventListener: vi.fn(),
	},
	horizontalTranslate: {
		addEventListener: vi.fn(),
	},
	depthTranslate: {
		addEventListener: vi.fn(),
	},
}));

describe("Socket", () => {
	let socket: Socket;
	let mockSocketCallback: (params: {
		mesh: Mesh;
		maxDimension: number;
		boundingBox: Box3;
	}) => void;

	beforeEach(() => {
		// Create mock event
		mockSocketCallback = vi.fn();

		// Create socket instance
		socket = new Socket({ socketCallback: mockSocketCallback });

		// Setup test mesh properties
		socket.mesh = {
			position: new Vector3(0, 0, 0),
			rotation: {
				x: 0,
				y: 0,
				z: 0,
				set: vi.fn(),
			},
			rotateX: vi.fn().mockImplementation(function (angle) {
				this.rotation.x += angle;
			}),
			rotateY: vi.fn().mockImplementation(function (angle) {
				this.rotation.y += angle;
			}),
			rotateZ: vi.fn().mockImplementation(function (angle) {
				this.rotation.z += angle;
			}),
			add: vi.fn(),
			clone: vi.fn().mockReturnThis(),
			updateWorldMatrix: vi.fn(),
			geometry: {
				computeVertexNormals: vi.fn(),
				applyMatrix4: vi.fn(),
				translate: vi.fn(),
			},
		} as unknown as Mesh;

		// Mock autoAlignMesh to prevent additional calculations in rotation tests
		socket.autoAlignMesh = vi.fn();

		// Reset mock position for position change tests
		socket.setPosition = new Vector3(0, 0, 0);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should initialize with event listeners", () => {
		const {
			stlFileInput,
			coronalRotater,
			sagittalRotate,
			transversalRotater,
			verticalTranslate,
			horizontalTranslate,
			depthTranslate,
		} = htmlElements;

		expect(stlFileInput.addEventListener).toHaveBeenCalledWith(
			"change",
			expect.any(Function),
		);
		expect(coronalRotater.addEventListener).toHaveBeenCalledWith(
			"click",
			socket.coronalRotate90,
		);
		expect(sagittalRotate.addEventListener).toHaveBeenCalledWith(
			"click",
			socket.sagittalRotate90,
		);
		expect(transversalRotater.addEventListener).toHaveBeenCalledWith(
			"click",
			socket.transversalRotater90,
		);
		expect(verticalTranslate.addEventListener).toHaveBeenCalledWith(
			"input",
			socket.verticalChange,
		);
		expect(horizontalTranslate.addEventListener).toHaveBeenCalledWith(
			"input",
			socket.horizontalChange,
		);
		expect(depthTranslate.addEventListener).toHaveBeenCalledWith(
			"input",
			socket.depthChange,
		);
	});

	it("should rotate mesh 90 degrees on coronalRotate90", () => {
		socket.coronalRotate90();

		expect(socket.mesh.rotation.x).toBeCloseTo(Math.PI / 2);
		expect(socket.mesh.rotation.y).toBe(0);
		expect(socket.mesh.rotation.z).toBe(0);
	});

	it("should rotate mesh 90 degrees on sagittalRotate90", () => {
		socket.sagittalRotate90();

		expect(socket.mesh.rotation.x).toBe(0);
		expect(socket.mesh.rotation.y).toBe(0);
		expect(socket.mesh.rotation.z).toBeCloseTo(Math.PI / 2);
	});

	it("should rotate mesh 90 degrees on transversalRotater90", () => {
		socket.transversalRotater90();

		expect(socket.mesh.rotation.x).toBe(0);
		expect(socket.mesh.rotation.y).toBeCloseTo(Math.PI / 2);
		expect(socket.mesh.rotation.z).toBe(0);
	});

	it("should change vertical position correctly", () => {
		const mockEvent = {
			target: {
				value: "10",
			},
		} as unknown as Event;

		socket.verticalChange(mockEvent);

		expect(socket.mesh.position.y).toBe(10);
	});

	it("should change horizontal position correctly", () => {
		const mockEvent = {
			target: {
				value: "10",
			},
		} as unknown as Event;

		socket.horizontalChange(mockEvent);

		expect(socket.mesh.position.x).toBe(-10);
	});

	it("should change depth position correctly", () => {
		const mockEvent = {
			target: {
				value: "10",
			},
		} as unknown as Event;

		socket.depthChange(mockEvent);

		expect(socket.mesh.position.z).toBe(-10);
	});
});

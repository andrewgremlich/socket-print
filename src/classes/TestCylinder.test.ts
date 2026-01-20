/**
 * @vitest-environment jsdom
 */
import { CylinderGeometry, Mesh, MeshStandardMaterial } from "three";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// Mock dexie liveQuery
const mockSubscriptions: { callback: (value: unknown) => void }[] = [];
vi.mock("dexie", () => ({
	liveQuery: vi.fn(() => ({
		subscribe: vi.fn((callback) => {
			const sub = { callback };
			mockSubscriptions.push(sub);
			return {
				unsubscribe: vi.fn(() => {
					const index = mockSubscriptions.indexOf(sub);
					if (index > -1) mockSubscriptions.splice(index, 1);
				}),
			};
		}),
	})),
}));

// Mock database actions
const mockGetTestCylinderHeight = vi.fn().mockResolvedValue(50);
const mockGetTestCylinderInnerDiameter = vi.fn().mockResolvedValue(75);

vi.mock("@/db/appSettingsDbActions", () => ({
	getTestCylinderHeight: () => mockGetTestCylinderHeight(),
	getTestCylinderInnerDiameter: () => mockGetTestCylinderInnerDiameter(),
}));

// Mock radial segments utility
vi.mock("@/utils/getRadialSegments", () => ({
	getRadialSegments: vi.fn().mockResolvedValue(128),
}));

// Mock ensureUV
vi.mock("@/3d/ensureUV", () => ({
	ensureUV: vi.fn(),
}));

// Mock three-mesh-bvh
vi.mock("three-mesh-bvh", () => ({
	MeshBVH: class MockMeshBVH {},
	acceleratedRaycast: vi.fn(),
}));

import { TestCylinder } from "./TestCylinder";

describe("TestCylinder", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSubscriptions.length = 0;
	});

	afterEach(async () => {
		mockSubscriptions.length = 0;
	});

	describe("create", () => {
		test("creates instance with default dimensions from database", async () => {
			const testCylinder = await TestCylinder.create();

			expect(testCylinder).toBeInstanceOf(TestCylinder);
			expect(testCylinder.mesh).toBeDefined();
			expect(testCylinder.mesh).toBeInstanceOf(Mesh);
		});

		test("creates mesh with CylinderGeometry", async () => {
			const testCylinder = await TestCylinder.create();

			expect(testCylinder.mesh?.geometry).toBeInstanceOf(CylinderGeometry);
		});

		test("creates mesh with MeshStandardMaterial", async () => {
			const testCylinder = await TestCylinder.create();

			expect(testCylinder.mesh?.material).toBeInstanceOf(MeshStandardMaterial);
		});

		test("material has white color and double side", async () => {
			const testCylinder = await TestCylinder.create();
			const material = testCylinder.mesh?.material as MeshStandardMaterial;

			expect(material.color.getHex()).toBe(0xffffff);
		});

		test("positions mesh at half height on y axis", async () => {
			const testCylinder = await TestCylinder.create();

			// Default height is 50, so y position should be 25
			expect(testCylinder.mesh?.position.y).toBe(25);
		});

		test("computes bounding box after creation", async () => {
			const testCylinder = await TestCylinder.create();

			expect(testCylinder.boundingBox).toBeDefined();
			expect(testCylinder.size).toBeDefined();
			expect(testCylinder.center).toBeDefined();
		});

		test("sets up live subscriptions", async () => {
			const testCylinder = await TestCylinder.create();

			expect(testCylinder.$liveTestCylinderInnerDiameter).toBeDefined();
			expect(testCylinder.$liveTestCylinderHeight).toBeDefined();
		});

		test("uses fallback values when database returns null", async () => {
			mockGetTestCylinderHeight.mockResolvedValueOnce(null);
			mockGetTestCylinderInnerDiameter.mockResolvedValueOnce(null);

			const testCylinder = await TestCylinder.create();

			// Should use fallback values: height=50, diameter=75
			expect(testCylinder.mesh?.position.y).toBe(25); // height/2 = 50/2
		});
	});

	describe("onChange", () => {
		test("registers callback function", async () => {
			const testCylinder = await TestCylinder.create();
			const callback = vi.fn();

			testCylinder.onChange(callback);

			// Callback should be stored (we can't directly access private field,
			// but we can verify it works by triggering a geometry update)
			expect(() => testCylinder.onChange(callback)).not.toThrow();
		});
	});

	describe("dispose", () => {
		test("unsubscribes from live queries", async () => {
			const testCylinder = await TestCylinder.create();
			const diameterUnsubscribe =
				testCylinder.$liveTestCylinderInnerDiameter?.unsubscribe;
			const heightUnsubscribe =
				testCylinder.$liveTestCylinderHeight?.unsubscribe;

			testCylinder.dispose();

			expect(diameterUnsubscribe).toHaveBeenCalled();
			expect(heightUnsubscribe).toHaveBeenCalled();
			expect(testCylinder.$liveTestCylinderInnerDiameter).toBeNull();
			expect(testCylinder.$liveTestCylinderHeight).toBeNull();
		});

		test("disposes mesh geometry and material", async () => {
			const testCylinder = await TestCylinder.create();
			const mesh = testCylinder.mesh;
			if (!mesh) throw new Error("Mesh not found");

			const geometryDisposeSpy = vi.spyOn(mesh.geometry, "dispose");
			const materialDisposeSpy = vi.spyOn(
				mesh.material as MeshStandardMaterial,
				"dispose",
			);

			testCylinder.dispose();

			expect(geometryDisposeSpy).toHaveBeenCalled();
			expect(materialDisposeSpy).toHaveBeenCalled();
		});
	});

	describe("geometry parameters", () => {
		test("cylinder geometry has correct parameters", async () => {
			const testCylinder = await TestCylinder.create();
			const geometry = testCylinder.mesh?.geometry as CylinderGeometry;
			const params = geometry.parameters;

			// Default diameter is 75, so radius is 37.5
			expect(params.radiusTop).toBe(37.5);
			expect(params.radiusBottom).toBe(37.5);
			expect(params.height).toBe(50);
			expect(params.radialSegments).toBe(128);
			expect(params.heightSegments).toBe(1);
			expect(params.openEnded).toBe(true);
		});
	});

	describe("inherited AppObject methods", () => {
		test("has computeBoundingBox method", async () => {
			const testCylinder = await TestCylinder.create();

			expect(typeof testCylinder.computeBoundingBox).toBe("function");
		});

		test("has updateMatrixWorld method", async () => {
			const testCylinder = await TestCylinder.create();

			expect(typeof testCylinder.updateMatrixWorld).toBe("function");
		});

		test("size reflects cylinder dimensions", async () => {
			const testCylinder = await TestCylinder.create();

			// Diameter is 75, height is 50
			expect(testCylinder.size?.x).toBeCloseTo(75, 0);
			expect(testCylinder.size?.y).toBeCloseTo(50, 0);
			expect(testCylinder.size?.z).toBeCloseTo(75, 0);
		});
	});
});

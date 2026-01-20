/**
 * @vitest-environment jsdom
 */
import { BufferGeometry, Mesh, MeshStandardMaterial } from "three";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// Mock dexie liveQuery
const mockLiveQuerySubscriptions: { callback: (value: unknown) => void }[] = [];
vi.mock("dexie", () => ({
	liveQuery: vi.fn(() => ({
		subscribe: vi.fn((callback) => {
			const sub = { callback };
			mockLiveQuerySubscriptions.push(sub);
			return {
				unsubscribe: vi.fn(() => {
					const index = mockLiveQuerySubscriptions.indexOf(sub);
					if (index > -1) mockLiveQuerySubscriptions.splice(index, 1);
				}),
			};
		}),
	})),
}));

// Mock database actions
const mockGetCupSize = vi.fn().mockResolvedValue({
	innerDiameter: 78,
	outerDiameter: 88,
	height: 25,
});

vi.mock("@/db/formValuesDbActions", () => ({
	getCupSize: () => mockGetCupSize(),
}));

// Mock radial segments utility
vi.mock("@/utils/getRadialSegments", () => ({
	getRadialSegments: vi.fn().mockResolvedValue(128),
}));

// Mock three-mesh-bvh
vi.mock("three-mesh-bvh", () => ({
	MeshBVH: class MockMeshBVH {},
	acceleratedRaycast: vi.fn(),
	computeBoundsTree: vi.fn(),
	disposeBoundsTree: vi.fn(),
}));

import { SocketCup } from "./SocketCup";

describe("SocketCup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockLiveQuerySubscriptions.length = 0;
		mockGetCupSize.mockResolvedValue({
			innerDiameter: 78,
			outerDiameter: 88,
			height: 25,
		});
	});

	afterEach(() => {
		mockLiveQuerySubscriptions.length = 0;
	});

	describe("create", () => {
		test("creates instance with dimensions from database", async () => {
			const socketCup = await SocketCup.create();

			expect(socketCup).toBeInstanceOf(SocketCup);
			expect(socketCup.mesh).toBeDefined();
			expect(socketCup.mesh).toBeInstanceOf(Mesh);
		});

		test("creates mesh with BufferGeometry", async () => {
			const socketCup = await SocketCup.create();

			expect(socketCup.mesh?.geometry).toBeInstanceOf(BufferGeometry);
		});

		test("creates mesh with MeshStandardMaterial", async () => {
			const socketCup = await SocketCup.create();

			expect(socketCup.mesh?.material).toBeInstanceOf(MeshStandardMaterial);
		});

		test("material has correct color", async () => {
			const socketCup = await SocketCup.create();
			const material = socketCup.mesh?.material as MeshStandardMaterial;

			expect(material.color.getHex()).toBe(0xb1314d);
		});

		test("sets dimensions from database values", async () => {
			const socketCup = await SocketCup.create();

			expect(socketCup.innerRadius).toBe(39); // 78 / 2
			expect(socketCup.outerRadius).toBe(44); // 88 / 2
			expect(socketCup.height).toBe(25);
		});

		test("sets up live subscription for cup size", async () => {
			const socketCup = await SocketCup.create();

			expect(socketCup.$liveCupSize).toBeDefined();
		});

		test("uses fallback values when database returns null", async () => {
			mockGetCupSize.mockResolvedValueOnce(null);

			const socketCup = await SocketCup.create();

			expect(socketCup.innerRadius).toBe(39); // 78 / 2
			expect(socketCup.outerRadius).toBe(44); // 78 / 2 + 5
			expect(socketCup.height).toBe(25);
		});

		test("uses fallback values when database returns invalid dimensions", async () => {
			mockGetCupSize.mockResolvedValueOnce({
				innerDiameter: 0,
				outerDiameter: -10,
				height: Number.NaN,
			});

			const socketCup = await SocketCup.create();

			expect(socketCup.innerRadius).toBe(39); // 78 / 2
			expect(socketCup.outerRadius).toBe(44); // 78 / 2 + 5
			expect(socketCup.height).toBe(25);
		});

		test("uses fallback values when innerDiameter is NaN", async () => {
			mockGetCupSize.mockResolvedValueOnce({
				innerDiameter: Number.NaN,
				outerDiameter: 88,
				height: 25,
			});

			const socketCup = await SocketCup.create();

			expect(socketCup.innerRadius).toBe(39);
		});
	});

	describe("default values", () => {
		test("has correct default radialSegments", async () => {
			const socketCup = await SocketCup.create();

			expect(socketCup.radialSegments).toBe(128);
		});

		test("has correct default tubularSegments", async () => {
			const socketCup = await SocketCup.create();

			expect(socketCup.tubularSegments).toBe(128);
		});

		test("has correct default bumpDangerZone", async () => {
			const socketCup = await SocketCup.create();

			expect(socketCup.bumpDangerZone).toBe(1);
		});

		test("has correct default taperRatio", async () => {
			const socketCup = await SocketCup.create();

			expect(socketCup.taperRatio).toBe(0.85);
		});
	});

	describe("geometry", () => {
		test("geometry has position attribute", async () => {
			const socketCup = await SocketCup.create();
			const geometry = socketCup.mesh?.geometry;

			expect(geometry?.getAttribute("position")).toBeDefined();
		});

		test("geometry has normal attribute", async () => {
			const socketCup = await SocketCup.create();
			const geometry = socketCup.mesh?.geometry;

			expect(geometry?.getAttribute("normal")).toBeDefined();
		});

		test("geometry has index", async () => {
			const socketCup = await SocketCup.create();
			const geometry = socketCup.mesh?.geometry;

			expect(geometry?.getIndex()).toBeDefined();
		});
	});

	describe("dispose", () => {
		test("unsubscribes from live query", async () => {
			const socketCup = await SocketCup.create();
			const unsubscribeMock = socketCup.$liveCupSize?.unsubscribe;

			socketCup.dispose();

			expect(unsubscribeMock).toHaveBeenCalled();
		});

		test("disposes mesh geometry", async () => {
			const socketCup = await SocketCup.create();
			const mesh = socketCup.mesh;
			if (!mesh) throw new Error("Mesh not found");

			const geometryDisposeSpy = vi.spyOn(mesh.geometry, "dispose");

			socketCup.dispose();

			expect(geometryDisposeSpy).toHaveBeenCalled();
		});
	});

	describe("inherited AppObject methods", () => {
		test("has computeBoundingBox method", async () => {
			const socketCup = await SocketCup.create();

			expect(typeof socketCup.computeBoundingBox).toBe("function");
		});

		test("has updateMatrixWorld method", async () => {
			const socketCup = await SocketCup.create();

			expect(typeof socketCup.updateMatrixWorld).toBe("function");
		});

		test("computeBoundingBox works correctly", async () => {
			const socketCup = await SocketCup.create();

			socketCup.computeBoundingBox();

			expect(socketCup.boundingBox).toBeDefined();
			expect(socketCup.size).toBeDefined();
			expect(socketCup.center).toBeDefined();
		});
	});
});

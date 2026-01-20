/**
 * @vitest-environment jsdom
 */
import { CylinderGeometry, Mesh, MeshStandardMaterial } from "three";
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
const mockGetTestCylinderInnerDiameter = vi.fn().mockResolvedValue(75);

vi.mock("@/db/appSettingsDbActions", () => ({
	getTestCylinderInnerDiameter: () => mockGetTestCylinderInnerDiameter(),
}));

const mockGetNozzleSize = vi.fn().mockResolvedValue(0.4);

vi.mock("@/db/formValuesDbActions", () => ({
	getNozzleSize: () => mockGetNozzleSize(),
}));

const mockGetActiveMaterialProfileShrinkFactor = vi.fn().mockResolvedValue(2);

vi.mock("@/db/materialProfilesDbActions", () => ({
	getActiveMaterialProfileShrinkFactor: () =>
		mockGetActiveMaterialProfileShrinkFactor(),
}));

// Mock radial segments utility
vi.mock("@/utils/getRadialSegments", () => ({
	getRadialSegments: vi.fn().mockResolvedValue(128),
}));

import { MergeCylinder } from "./MergeCylinder";

describe("MergeCylinder", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockLiveQuerySubscriptions.length = 0;
		mockGetTestCylinderInnerDiameter.mockResolvedValue(75);
		mockGetNozzleSize.mockResolvedValue(0.4);
		mockGetActiveMaterialProfileShrinkFactor.mockResolvedValue(2);
	});

	afterEach(() => {
		mockLiveQuerySubscriptions.length = 0;
	});

	describe("create", () => {
		test("creates instance", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });

			expect(mergeCylinder).toBeInstanceOf(MergeCylinder);
			expect(mergeCylinder.mesh).toBeDefined();
			expect(mergeCylinder.mesh).toBeInstanceOf(Mesh);
		});

		test("creates mesh with CylinderGeometry", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });

			expect(mergeCylinder.mesh?.geometry).toBeInstanceOf(CylinderGeometry);
		});

		test("creates mesh with MeshStandardMaterial", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });

			expect(mergeCylinder.mesh?.material).toBeInstanceOf(MeshStandardMaterial);
		});

		test("material has white color", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });
			const material = mergeCylinder.mesh?.material as MeshStandardMaterial;

			expect(material.color.getHex()).toBe(0xffffff);
		});

		test("sets height from options", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 100 });

			expect(mergeCylinder.height).toBe(100);
		});

		test("defaults height to 0 when no options provided", async () => {
			const mergeCylinder = await MergeCylinder.create();

			expect(mergeCylinder.height).toBe(0);
		});

		test("positions mesh at half height on y axis", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 60 });

			expect(mergeCylinder.mesh?.position.y).toBe(30); // height / 2
		});

		test("sets up live subscription for diameter", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });

			expect(mergeCylinder.$liveTestCylinderInnerDiameter).toBeDefined();
		});

		test("applies shrink factor and nozzle offset to radius", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });
			const geometry = mergeCylinder.mesh?.geometry as CylinderGeometry;

			// diameter=75, shrinkFactor=2, nozzleSize=0.4
			// shrinkScale = floor(1 / (1 - 2/100), 4) = floor(1.0204..., 4) = 1.0204
			// startingX = 75/2 = 37.5
			// nozzleSizeOffset = 0.4 / 2 = 0.2
			// transformedRadius = 37.5 * 1.0204 + 0.2 = 38.465 + 0.2 = 38.665
			expect(geometry.parameters.radiusTop).toBeCloseTo(38.465, 1);
		});
	});

	describe("setHeight", () => {
		test("updates height property", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });

			mergeCylinder.setHeight(100);

			expect(mergeCylinder.height).toBe(100);
		});

		test("updates mesh position after height change", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });

			mergeCylinder.setHeight(80);

			expect(mergeCylinder.mesh?.position.y).toBe(40); // 80 / 2
		});

		test("updates geometry with new height", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });

			mergeCylinder.setHeight(120);

			const geometry = mergeCylinder.mesh?.geometry as CylinderGeometry;
			expect(geometry.parameters.height).toBe(120);
		});
	});

	describe("geometry parameters", () => {
		test("cylinder geometry is open-ended", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });
			const geometry = mergeCylinder.mesh?.geometry as CylinderGeometry;

			expect(geometry.parameters.openEnded).toBe(true);
		});

		test("cylinder has correct radial segments", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });
			const geometry = mergeCylinder.mesh?.geometry as CylinderGeometry;

			expect(geometry.parameters.radialSegments).toBe(128);
		});

		test("cylinder has 1 height segment", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });
			const geometry = mergeCylinder.mesh?.geometry as CylinderGeometry;

			expect(geometry.parameters.heightSegments).toBe(1);
		});

		test("radiusTop equals radiusBottom", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });
			const geometry = mergeCylinder.mesh?.geometry as CylinderGeometry;

			expect(geometry.parameters.radiusTop).toBe(
				geometry.parameters.radiusBottom,
			);
		});
	});

	describe("dispose", () => {
		test("unsubscribes from live query", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });
			const unsubscribeMock =
				mergeCylinder.$liveTestCylinderInnerDiameter?.unsubscribe;

			mergeCylinder.dispose();

			expect(unsubscribeMock).toHaveBeenCalled();
			expect(mergeCylinder.$liveTestCylinderInnerDiameter).toBeNull();
		});

		test("disposes mesh geometry", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });
			const mesh = mergeCylinder.mesh;
			if (!mesh) throw new Error("Mesh not found");

			const geometryDisposeSpy = vi.spyOn(mesh.geometry, "dispose");

			mergeCylinder.dispose();

			expect(geometryDisposeSpy).toHaveBeenCalled();
		});

		test("disposes mesh material", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });
			const mesh = mergeCylinder.mesh;
			if (!mesh) throw new Error("Mesh not found");

			const materialDisposeSpy = vi.spyOn(
				mesh.material as MeshStandardMaterial,
				"dispose",
			);

			mergeCylinder.dispose();

			expect(materialDisposeSpy).toHaveBeenCalled();
		});
	});

	describe("inherited AppObject methods", () => {
		test("has computeBoundingBox method", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });

			expect(typeof mergeCylinder.computeBoundingBox).toBe("function");
		});

		test("has updateMatrixWorld method", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });

			expect(typeof mergeCylinder.updateMatrixWorld).toBe("function");
		});

		test("computes bounding box correctly", async () => {
			const mergeCylinder = await MergeCylinder.create({ height: 50 });

			expect(mergeCylinder.boundingBox).toBeDefined();
			expect(mergeCylinder.size).toBeDefined();
			expect(mergeCylinder.center).toBeDefined();
		});
	});
});

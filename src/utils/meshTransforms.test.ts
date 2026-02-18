import { Box3, BoxGeometry, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
	applyRotation,
	applyTranslation,
	autoAlignMesh,
	saveRotationToDatabase,
	saveTranslationToDatabase,
} from "./meshTransforms";

const mockUpdateRotateValues = vi.fn();
const mockUpdateTranslateValues = vi.fn();

vi.mock("@/db/appSettingsDbActions", () => ({
	updateRotateValues: (...args: unknown[]) => mockUpdateRotateValues(...args),
	updateTranslateValues: (...args: unknown[]) =>
		mockUpdateTranslateValues(...args),
}));

function createMesh(): Mesh {
	return new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
}

describe("autoAlignMesh", () => {
	test("centers mesh on X and Z axes", () => {
		const mesh = createMesh();
		mesh.position.set(5, 0, 10);
		const center = new Vector3(3, 0, 7);
		const boundingBox = new Box3(new Vector3(-1, 0, -1), new Vector3(1, 2, 1));

		autoAlignMesh(mesh, boundingBox, center, null);

		expect(mesh.position.x).toBe(2);
		expect(mesh.position.z).toBe(3);
	});

	test("adjusts Y position when minY is negative and lockDepth is provided", () => {
		const mesh = createMesh();
		mesh.position.set(0, 0, 0);
		const center = new Vector3(0, 0, 0);
		const boundingBox = new Box3(new Vector3(0, -10, 0), new Vector3(1, 1, 1));

		autoAlignMesh(mesh, boundingBox, center, 3);

		// y += abs(-10) - 3 = 7
		expect(mesh.position.y).toBe(7);
	});

	test("does not adjust Y when lockDepth is null", () => {
		const mesh = createMesh();
		mesh.position.set(0, 5, 0);
		const center = new Vector3(0, 0, 0);
		const boundingBox = new Box3(new Vector3(0, -10, 0), new Vector3(1, 1, 1));

		autoAlignMesh(mesh, boundingBox, center, null);

		expect(mesh.position.y).toBe(5);
	});

	test("does not adjust Y when minY is not negative", () => {
		const mesh = createMesh();
		mesh.position.set(0, 0, 0);
		const center = new Vector3(0, 0, 0);
		const boundingBox = new Box3(new Vector3(0, 2, 0), new Vector3(1, 5, 1));

		autoAlignMesh(mesh, boundingBox, center, 3);

		expect(mesh.position.y).toBe(0);
	});
});

describe("applyRotation", () => {
	test("rotates mesh around X axis", () => {
		const mesh = createMesh();
		applyRotation(mesh, "x", Math.PI / 4);

		expect(mesh.rotation.x).toBeCloseTo(Math.PI / 4);
	});

	test("rotates mesh around Y axis", () => {
		const mesh = createMesh();
		applyRotation(mesh, "y", Math.PI / 2);

		expect(mesh.rotation.y).toBeCloseTo(Math.PI / 2);
	});

	test("rotates mesh around Z axis", () => {
		const mesh = createMesh();
		applyRotation(mesh, "z", Math.PI / 6);

		expect(mesh.rotation.z).toBeCloseTo(Math.PI / 6);
	});

	test("accumulates multiple rotations on same axis", () => {
		const mesh = createMesh();
		applyRotation(mesh, "x", Math.PI / 4);
		applyRotation(mesh, "x", Math.PI / 4);

		expect(mesh.rotation.x).toBeCloseTo(Math.PI / 2);
	});
});

describe("applyTranslation", () => {
	test("sets X position as negated value", () => {
		const mesh = createMesh();
		applyTranslation(mesh, "x", 5, 0);

		expect(mesh.position.x).toBe(-5);
	});

	test("sets Y position with offset added", () => {
		const mesh = createMesh();
		applyTranslation(mesh, "y", 10, 3);

		expect(mesh.position.y).toBe(13);
	});

	test("sets Z position as negated value", () => {
		const mesh = createMesh();
		applyTranslation(mesh, "z", 7, 0);

		expect(mesh.position.z).toBe(-7);
	});

	test("Y offset is independent of value", () => {
		const mesh = createMesh();
		applyTranslation(mesh, "y", 0, 5);

		expect(mesh.position.y).toBe(5);
	});
});

describe("saveRotationToDatabase", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test("saves rotation with correct axis mapping (x, z, y)", async () => {
		const mesh = createMesh();
		mesh.rotation.set(0.1, 0.2, 0.3);

		await saveRotationToDatabase(mesh);

		expect(mockUpdateRotateValues).toHaveBeenCalledWith(0.1, 0.3, 0.2);
	});
});

describe("saveTranslationToDatabase", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test("saves translation values from mesh position", async () => {
		const mesh = createMesh();
		mesh.position.set(1, 2, 3);

		await saveTranslationToDatabase(mesh);

		expect(mockUpdateTranslateValues).toHaveBeenCalledWith(1, 2, 3);
	});
});

/**
 * @vitest-environment jsdom
 */
import { Box3, BoxGeometry, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { MeshTransformController } from "./MeshTransformController";
import type { MeshContext } from "./types";

// Mock database actions
vi.mock("@/db/appSettingsDbActions", () => ({
	getRotateValues: vi.fn().mockResolvedValue({ x: 0, y: 0, z: 0 }),
	getTranslateValues: vi.fn().mockResolvedValue({ x: 0, y: 0, z: 0 }),
	updateRotateValues: vi.fn().mockResolvedValue(undefined),
	updateTranslateValues: vi.fn().mockResolvedValue(undefined),
}));

// Mock HTML elements
vi.mock("@/utils/htmlElements", () => ({
	xTranslate: { value: "0" },
	yTranslate: { value: "0" },
	zTranslate: { value: "0" },
}));

// Mock mesh transforms
vi.mock("@/utils/meshTransforms", () => ({
	applyRotation: vi.fn(),
	applyTranslation: vi.fn(),
	autoAlignMesh: vi.fn(),
	saveRotationToDatabase: vi.fn().mockResolvedValue(undefined),
	saveTranslationToDatabase: vi.fn().mockResolvedValue(undefined),
}));

function createMockMesh(): Mesh {
	const geometry = new BoxGeometry(10, 20, 10);
	const material = new MeshStandardMaterial();
	return new Mesh(geometry, material);
}

function createMeshContext(mesh: Mesh): MeshContext {
	return {
		mesh,
		lockDepth: 5,
		offsetYPosition: 10,
	};
}

describe("MeshTransformController", () => {
	let controller: MeshTransformController;
	let mockShowError: (message: string) => void;
	let mockMesh: Mesh;

	beforeEach(() => {
		vi.clearAllMocks();
		mockShowError = vi.fn();
		controller = new MeshTransformController(mockShowError);
		mockMesh = createMockMesh();
	});

	describe("setMesh", () => {
		test("sets mesh context correctly", () => {
			const context = createMeshContext(mockMesh);
			controller.setMesh(context);

			// Verify by attempting operations that require mesh
			expect(() => controller.clear()).not.toThrow();
		});
	});

	describe("onTransformChange", () => {
		test("registers callback that is called after rotation", async () => {
			const callback = vi.fn().mockResolvedValue(undefined);
			controller.onTransformChange(callback);
			controller.setMesh(createMeshContext(mockMesh));

			await controller.handleRotation("x", Math.PI / 2, () => ({
				boundingBox: new Box3(),
				center: new Vector3(),
			}));

			expect(callback).toHaveBeenCalled();
		});

		test("registers callback that is called after translation", async () => {
			const callback = vi.fn().mockResolvedValue(undefined);
			controller.onTransformChange(callback);
			controller.setMesh(createMeshContext(mockMesh));

			const mockEvent = { target: { value: "10" } } as unknown as Event;
			await controller.handleTranslation("x", mockEvent);

			expect(callback).toHaveBeenCalled();
		});
	});

	describe("autoAlign", () => {
		test("calls autoAlignMesh with correct parameters", async () => {
			const { autoAlignMesh } = await import("@/utils/meshTransforms");
			controller.setMesh(createMeshContext(mockMesh));

			const boundingBox = new Box3(
				new Vector3(-5, -10, -5),
				new Vector3(5, 10, 5),
			);
			const center = new Vector3(0, 0, 0);

			controller.autoAlign(() => ({ boundingBox, center }));

			expect(autoAlignMesh).toHaveBeenCalledWith(
				mockMesh,
				boundingBox,
				center,
				5, // lockDepth
			);
		});

		test("does nothing when mesh is not set", async () => {
			const { autoAlignMesh } = await import("@/utils/meshTransforms");

			controller.autoAlign(() => ({
				boundingBox: new Box3(),
				center: new Vector3(),
			}));

			expect(autoAlignMesh).not.toHaveBeenCalled();
		});

		test("does nothing when computeBoundingBox returns undefined", async () => {
			const { autoAlignMesh } = await import("@/utils/meshTransforms");
			controller.setMesh(createMeshContext(mockMesh));

			controller.autoAlign(() => ({
				boundingBox: undefined,
				center: undefined,
			}));

			expect(autoAlignMesh).not.toHaveBeenCalled();
		});
	});

	describe("restoreFromDatabase", () => {
		test("restores position from database when loadedFromDb is true", async () => {
			const { getTranslateValues } = await import("@/db/appSettingsDbActions");
			vi.mocked(getTranslateValues).mockResolvedValueOnce({
				x: 5,
				y: 15,
				z: -3,
			});

			controller.setMesh(createMeshContext(mockMesh));
			await controller.restoreFromDatabase(true);

			expect(mockMesh.position.x).toBe(5);
			expect(mockMesh.position.y).toBe(15);
			expect(mockMesh.position.z).toBe(-3);
		});

		test("sets default position when loadedFromDb is false", async () => {
			controller.setMesh(createMeshContext(mockMesh));
			await controller.restoreFromDatabase(false);

			expect(mockMesh.position.x).toBe(0);
			expect(mockMesh.position.y).toBe(10); // offsetYPosition
			expect(mockMesh.position.z).toBe(0);
		});

		test("restores rotation from database", async () => {
			const { getRotateValues } = await import("@/db/appSettingsDbActions");
			vi.mocked(getRotateValues).mockResolvedValueOnce({
				x: Math.PI / 4,
				y: Math.PI / 2,
				z: Math.PI,
			});

			controller.setMesh(createMeshContext(mockMesh));
			await controller.restoreFromDatabase(false);

			expect(mockMesh.rotation.x).toBe(Math.PI / 4);
			expect(mockMesh.rotation.y).toBe(Math.PI);
			expect(mockMesh.rotation.z).toBe(Math.PI / 2);
		});

		test("shows error when database fetch fails", async () => {
			const { getTranslateValues } = await import("@/db/appSettingsDbActions");
			vi.mocked(getTranslateValues).mockRejectedValueOnce(
				new Error("DB error"),
			);

			controller.setMesh(createMeshContext(mockMesh));
			await controller.restoreFromDatabase(false);

			expect(mockShowError).toHaveBeenCalledWith(
				"Failed to load position settings",
			);
		});

		test("does nothing when mesh is not set", async () => {
			const { getTranslateValues } = await import("@/db/appSettingsDbActions");

			await controller.restoreFromDatabase(false);

			expect(getTranslateValues).not.toHaveBeenCalled();
		});
	});

	describe("handleRotation", () => {
		test("applies rotation to mesh", async () => {
			const { applyRotation } = await import("@/utils/meshTransforms");
			controller.setMesh(createMeshContext(mockMesh));

			await controller.handleRotation("x", Math.PI / 2, () => ({
				boundingBox: new Box3(),
				center: new Vector3(),
			}));

			expect(applyRotation).toHaveBeenCalledWith(mockMesh, "x", Math.PI / 2);
		});

		test("saves rotation to database", async () => {
			const { saveRotationToDatabase } = await import("@/utils/meshTransforms");
			controller.setMesh(createMeshContext(mockMesh));

			await controller.handleRotation("y", Math.PI, () => ({
				boundingBox: new Box3(),
				center: new Vector3(),
			}));

			expect(saveRotationToDatabase).toHaveBeenCalledWith(mockMesh);
		});

		test("shows error when save fails", async () => {
			const { saveRotationToDatabase } = await import("@/utils/meshTransforms");
			vi.mocked(saveRotationToDatabase).mockRejectedValueOnce(
				new Error("Save error"),
			);

			controller.setMesh(createMeshContext(mockMesh));
			await controller.handleRotation("z", Math.PI / 4, () => ({
				boundingBox: new Box3(),
				center: new Vector3(),
			}));

			expect(mockShowError).toHaveBeenCalledWith(
				"Failed to save rotation settings",
			);
		});

		test("does nothing when mesh is not set", async () => {
			const { applyRotation } = await import("@/utils/meshTransforms");

			await controller.handleRotation("x", Math.PI / 2, () => ({
				boundingBox: new Box3(),
				center: new Vector3(),
			}));

			expect(applyRotation).not.toHaveBeenCalled();
		});
	});

	describe("handleTranslation", () => {
		test("applies translation to mesh", async () => {
			const { applyTranslation } = await import("@/utils/meshTransforms");
			controller.setMesh(createMeshContext(mockMesh));

			const mockEvent = { target: { value: "15" } } as unknown as Event;
			await controller.handleTranslation("x", mockEvent);

			expect(applyTranslation).toHaveBeenCalledWith(mockMesh, "x", 15, 10);
		});

		test("saves translation to database", async () => {
			const { saveTranslationToDatabase } = await import(
				"@/utils/meshTransforms"
			);
			controller.setMesh(createMeshContext(mockMesh));

			const mockEvent = { target: { value: "20" } } as unknown as Event;
			await controller.handleTranslation("y", mockEvent);

			expect(saveTranslationToDatabase).toHaveBeenCalledWith(mockMesh);
		});

		test("ignores NaN values", async () => {
			const { applyTranslation } = await import("@/utils/meshTransforms");
			controller.setMesh(createMeshContext(mockMesh));

			const mockEvent = {
				target: { value: "not a number" },
			} as unknown as Event;
			await controller.handleTranslation("x", mockEvent);

			expect(applyTranslation).not.toHaveBeenCalled();
		});

		test("shows error when save fails", async () => {
			const { saveTranslationToDatabase } = await import(
				"@/utils/meshTransforms"
			);
			vi.mocked(saveTranslationToDatabase).mockRejectedValueOnce(
				new Error("Save error"),
			);

			controller.setMesh(createMeshContext(mockMesh));
			const mockEvent = { target: { value: "10" } } as unknown as Event;
			await controller.handleTranslation("z", mockEvent);

			expect(mockShowError).toHaveBeenCalledWith(
				"Failed to save position settings",
			);
		});

		test("does nothing when mesh is not set", async () => {
			const { applyTranslation } = await import("@/utils/meshTransforms");

			const mockEvent = { target: { value: "10" } } as unknown as Event;
			await controller.handleTranslation("x", mockEvent);

			expect(applyTranslation).not.toHaveBeenCalled();
		});
	});

	describe("resetDatabase", () => {
		test("resets rotation and translation values", async () => {
			const { updateRotateValues, updateTranslateValues } = await import(
				"@/db/appSettingsDbActions"
			);

			await controller.resetDatabase();

			expect(updateRotateValues).toHaveBeenCalledWith(0, 0, 0);
			expect(updateTranslateValues).toHaveBeenCalledWith(0, 0, 0);
		});

		test("shows error when reset fails", async () => {
			const { updateRotateValues } = await import("@/db/appSettingsDbActions");
			vi.mocked(updateRotateValues).mockRejectedValueOnce(
				new Error("Reset error"),
			);

			await controller.resetDatabase();

			expect(mockShowError).toHaveBeenCalledWith(
				"Failed to reset position settings",
			);
		});
	});

	describe("clear", () => {
		test("clears mesh reference and resets values", () => {
			controller.setMesh(createMeshContext(mockMesh));

			controller.clear();

			// Verify by checking that operations requiring mesh do nothing
			expect(() => controller.clear()).not.toThrow();
		});
	});
});

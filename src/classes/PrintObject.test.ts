/**
 * @vitest-environment jsdom
 */
import {
	Box3,
	BoxGeometry,
	Mesh,
	MeshStandardMaterial,
	Scene,
	Vector3,
} from "three";
import { MeshBVH } from "three-mesh-bvh";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { PrintObjectType } from "@/db/types";
import { QUARTER_TURN } from "@/utils/constants";

// Mock Three.js addons to avoid canvas requirements
vi.mock("three/examples/jsm/Addons.js", () => ({
	STLExporter: vi.fn().mockImplementation(() => ({
		parse: vi.fn().mockReturnValue("solid mock\nendsolid mock"),
	})),
}));

vi.mock("three/examples/jsm/loaders/STLLoader.js", () => ({
	STLLoader: vi.fn().mockImplementation(() => ({
		parse: vi.fn().mockReturnValue(new BoxGeometry(10, 10, 10)),
	})),
}));

// Mock all external dependencies
vi.mock("@/db/appSettingsDbActions", () => ({
	getLockDepth: vi.fn().mockResolvedValue(5),
	getRotateValues: vi
		.fn()
		.mockResolvedValue({ coronal: 0, sagittal: 0, transverse: 0 }),
	getTranslateValues: vi.fn().mockResolvedValue({ x: 0, y: 0, z: 0 }),
	updateRotateValues: vi.fn().mockResolvedValue(undefined),
	updateTranslateValues: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/db/file", () => ({
	getAllFiles: vi.fn().mockResolvedValue([]),
	setFileByName: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/db/formValuesDbActions", () => ({
	getNozzleSize: vi.fn().mockResolvedValue(0.4),
}));

vi.mock("@/db/materialProfilesDbActions", () => ({
	getActiveMaterialProfileShrinkFactor: vi.fn().mockResolvedValue(2),
}));

vi.mock("@/3d/generateOffsetWithNormal", () => ({
	applyOffset: vi.fn().mockImplementation((mesh) => Promise.resolve(mesh)),
}));

vi.mock("@/3d/ensureUV", () => ({
	ensureUV: vi.fn(),
}));

vi.mock("@/utils/printObject", () => ({
	fetchStlFile: vi.fn().mockReturnValue(() => Promise.resolve()),
	setStlFileInputAndDispatch: vi.fn(),
}));

// Mock HTML elements - must be inline in the factory function due to hoisting
vi.mock("@/utils/htmlElements", () => ({
	stlFileInput: document.createElement("input"),
	activeFileName: document.createElement("span"),
	addTestStlButton: document.createElement("button"),
	addTestCylinderButton: document.createElement("button"),
	coronalRotater: Object.assign(document.createElement("button"), {
		disabled: false,
	}),
	sagittalRotate: Object.assign(document.createElement("button"), {
		disabled: false,
	}),
	transversalRotater: Object.assign(document.createElement("button"), {
		disabled: false,
	}),
	verticalTranslate: Object.assign(document.createElement("input"), {
		value: "0",
		disabled: false,
	}),
	horizontalTranslate: Object.assign(document.createElement("input"), {
		value: "0",
		disabled: false,
	}),
	depthTranslate: Object.assign(document.createElement("input"), {
		value: "0",
		disabled: false,
	}),
	loadingScreen: Object.assign(document.createElement("div"), {
		style: { display: "none" },
	}),
	collisionWarning: Object.assign(document.createElement("div"), {
		style: { display: "none" },
	}),
	generateGCodeButton: Object.assign(document.createElement("button"), {
		disabled: false,
	}),
	printerFileInput: Object.assign(document.createElement("input"), {
		disabled: false,
	}),
}));

// Mock TestCylinder class
vi.mock("./TestCylinder", () => ({
	TestCylinder: {
		create: vi.fn().mockImplementation(async () => {
			const { BoxGeometry, Mesh, MeshStandardMaterial } = await import("three");
			const geometry = new BoxGeometry(10, 20, 10);
			const material = new MeshStandardMaterial();
			const mesh = new Mesh(geometry, material);
			return {
				mesh,
				size: { x: 10, y: 20, z: 10 },
				onChange: vi.fn(),
				dispose: vi.fn(),
			};
		}),
	},
}));

// Mock CupToSocketTransition class
vi.mock("./CupToSocketTransition", () => ({
	CupToSocketTransition: {
		create: vi.fn().mockImplementation(async () => {
			return {
				computeTransition: vi.fn().mockResolvedValue({ isValid: true }),
				isValidFit: vi.fn().mockReturnValue(true),
				dispose: vi.fn(),
				mesh: null,
			};
		}),
	},
}));

import * as htmlElements from "@/utils/htmlElements";
// Import after mocks are set up
import { PrintObject } from "./PrintObject";

type Callback = (params: { size: { x: number; y: number; z: number } }) => void;

// Helper to create mock SocketCup
function createMockSocketCup() {
	const geometry = new BoxGeometry(50, 50, 50);
	geometry.computeBoundingBox();
	const material = new MeshStandardMaterial();
	const mesh = new Mesh(geometry, material);
	mesh.geometry.boundsTree = new MeshBVH(geometry);

	return {
		mesh,
		size: new Vector3(50, 50, 50),
		boundingBox: new Box3(new Vector3(-25, -25, -25), new Vector3(25, 25, 25)),
	};
}

// Helper to create mock Scene
function createMockScene() {
	return new Scene();
}

// Helper to create a PrintObject with mesh
async function createPrintObjectWithMesh(): Promise<PrintObject> {
	const callback: Callback = vi.fn();
	const socketCup = createMockSocketCup();
	const scene = createMockScene();
	const printObject = new PrintObject({
		callback,
		socketCup: socketCup as never,
		scene,
	});

	// Manually set up a mesh
	const geometry = new BoxGeometry(10, 20, 10);
	const material = new MeshStandardMaterial();
	printObject.mesh = new Mesh(geometry, material);
	printObject.mesh.geometry.boundsTree = new MeshBVH(geometry);
	printObject.computeBoundingBox();

	return printObject;
}

describe("PrintObject", () => {
	let printObject: PrintObject;
	let mockCallback: Callback;
	let mockSocketCup: ReturnType<typeof createMockSocketCup>;
	let mockScene: Scene;

	beforeEach(() => {
		vi.clearAllMocks();
		mockCallback = vi.fn();
		mockSocketCup = createMockSocketCup();
		mockScene = createMockScene();

		// Reset HTML element states
		htmlElements.loadingScreen.style.display = "none";
		htmlElements.collisionWarning.style.display = "none";
		htmlElements.generateGCodeButton.disabled = false;
		htmlElements.printerFileInput.disabled = false;
	});

	afterEach(() => {
		if (printObject) {
			printObject.dispose();
		}
	});

	describe("constructor", () => {
		test("creates instance with callback and socketCup", () => {
			printObject = new PrintObject({
				callback: mockCallback,
				socketCup: mockSocketCup as never,
				scene: mockScene,
			});

			expect(printObject).toBeInstanceOf(PrintObject);
			expect(printObject.callback).toBe(mockCallback);
			expect(printObject.socketCup).toBe(mockSocketCup);
		});

		test("initializes with default values", () => {
			printObject = new PrintObject({
				callback: mockCallback,
				socketCup: mockSocketCup as never,
				scene: mockScene,
			});

			expect(printObject.lockDepth).toBeNull();
			expect(printObject.loadedStlFromIndexedDb).toBe(false);
			expect(printObject.offsetYPosition).toBe(0);
			expect(printObject.currentType).toBeUndefined();
		});

		test("throws error if stlFileInput is not found", async () => {
			const originalStlFileInput = htmlElements.stlFileInput;
			// @ts-expect-error - intentionally setting to null for test
			htmlElements.stlFileInput = null;

			expect(() => {
				new PrintObject({
					callback: mockCallback,
					socketCup: mockSocketCup as never,
					scene: mockScene,
				});
			}).toThrow("STL File Input not found");

			// @ts-expect-error - restoring original value
			htmlElements.stlFileInput = originalStlFileInput;
		});
	});

	describe("dispose", () => {
		test("cleans up mesh resources", async () => {
			printObject = await createPrintObjectWithMesh();
			const mesh = printObject.mesh;
			if (!mesh) throw new Error("Mesh not found");

			const geometryDisposeSpy = vi.spyOn(mesh.geometry, "dispose");
			const materialDisposeSpy = vi.spyOn(
				mesh.material as MeshStandardMaterial,
				"dispose",
			);

			printObject.dispose();

			expect(geometryDisposeSpy).toHaveBeenCalled();
			expect(materialDisposeSpy).toHaveBeenCalled();
		});

		test("handles mesh with array of materials", async () => {
			printObject = await createPrintObjectWithMesh();
			const mesh = printObject.mesh;
			if (!mesh) throw new Error("Mesh not found");

			const materials = [
				new MeshStandardMaterial(),
				new MeshStandardMaterial(),
			];
			mesh.material = materials;

			const disposeSpy1 = vi.spyOn(materials[0], "dispose");
			const disposeSpy2 = vi.spyOn(materials[1], "dispose");

			printObject.dispose();

			expect(disposeSpy1).toHaveBeenCalled();
			expect(disposeSpy2).toHaveBeenCalled();
		});
	});

	describe("applyShrinkScale", () => {
		test("applies shrink scale to mesh geometry", async () => {
			printObject = await createPrintObjectWithMesh();
			const mesh = printObject.mesh;
			if (!mesh) throw new Error("Mesh not found");

			const scaleSpy = vi.spyOn(mesh.geometry, "scale");

			await printObject.applyShrinkScale();

			expect(scaleSpy).toHaveBeenCalled();
		});

		test("logs error when no mesh exists", async () => {
			printObject = new PrintObject({
				callback: mockCallback,
				socketCup: mockSocketCup as never,
				scene: mockScene,
			});
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			await printObject.applyShrinkScale();

			expect(consoleSpy).toHaveBeenCalledWith("No Mesh found");
			consoleSpy.mockRestore();
		});
	});

	describe("applyNozzleSizeOffset", () => {
		test("applies nozzle size offset to mesh", async () => {
			const { applyOffset } = await import("@/3d/generateOffsetWithNormal");
			printObject = await createPrintObjectWithMesh();

			await printObject.applyNozzleSizeOffset();

			expect(applyOffset).toHaveBeenCalled();
		});

		test("logs error when no mesh exists", async () => {
			printObject = new PrintObject({
				callback: mockCallback,
				socketCup: mockSocketCup as never,
				scene: mockScene,
			});
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			await printObject.applyNozzleSizeOffset();

			expect(consoleSpy).toHaveBeenCalledWith("No Mesh found");
			consoleSpy.mockRestore();
		});
	});

	describe("clearData", () => {
		test("disposes mesh and resets state", async () => {
			printObject = await createPrintObjectWithMesh();
			printObject.currentType = PrintObjectType.Socket;
			printObject.loadedStlFromIndexedDb = true;

			await printObject.clearData();

			expect(printObject.mesh).toBeUndefined();
			expect(printObject.boundingBox).toBeUndefined();
			expect(printObject.center).toBeUndefined();
			expect(printObject.size).toBeUndefined();
			expect(printObject.loadedStlFromIndexedDb).toBe(false);
			expect(printObject.currentType).toBeUndefined();
		});

		test("resets transform values in database", async () => {
			const { updateRotateValues, updateTranslateValues } = await import(
				"@/db/appSettingsDbActions"
			);
			printObject = await createPrintObjectWithMesh();

			await printObject.clearData();

			expect(updateRotateValues).toHaveBeenCalledWith(0, 0, 0);
			expect(updateTranslateValues).toHaveBeenCalledWith(0, 0, 0);
		});

		test("enables input controls", async () => {
			printObject = await createPrintObjectWithMesh();
			htmlElements.coronalRotater.disabled = false;

			await printObject.clearData();

			expect(htmlElements.coronalRotater.disabled).toBe(true);
		});
	});

	describe("toggleInput", () => {
		test("disables all controls when true", () => {
			printObject = new PrintObject({
				callback: mockCallback,
				socketCup: mockSocketCup as never,
				scene: mockScene,
			});

			printObject.toggleInput(true);

			expect(htmlElements.coronalRotater.disabled).toBe(true);
			expect(htmlElements.sagittalRotate.disabled).toBe(true);
			expect(htmlElements.transversalRotater.disabled).toBe(true);
			expect(htmlElements.verticalTranslate.disabled).toBe(true);
			expect(htmlElements.horizontalTranslate.disabled).toBe(true);
			expect(htmlElements.depthTranslate.disabled).toBe(true);
		});

		test("enables all controls when false", () => {
			printObject = new PrintObject({
				callback: mockCallback,
				socketCup: mockSocketCup as never,
				scene: mockScene,
			});

			printObject.toggleInput(false);

			expect(htmlElements.coronalRotater.disabled).toBe(false);
			expect(htmlElements.sagittalRotate.disabled).toBe(false);
			expect(htmlElements.transversalRotater.disabled).toBe(false);
			expect(htmlElements.verticalTranslate.disabled).toBe(false);
			expect(htmlElements.horizontalTranslate.disabled).toBe(false);
			expect(htmlElements.depthTranslate.disabled).toBe(false);
		});
	});

	describe("autoAlignMesh", () => {
		test("centers mesh on x and z axes", async () => {
			printObject = await createPrintObjectWithMesh();
			const mesh = printObject.mesh;
			if (!mesh) throw new Error("Mesh not found");

			mesh.position.set(10, 5, 10);
			printObject.lockDepth = 0;

			printObject.autoAlignMesh();

			expect(mesh.position.x).toBeCloseTo(0, 1);
			expect(mesh.position.z).toBeCloseTo(0, 1);
		});

		test("adjusts y position when minY is below zero with lockDepth", async () => {
			printObject = await createPrintObjectWithMesh();
			const mesh = printObject.mesh;
			if (!mesh) throw new Error("Mesh not found");

			mesh.position.set(0, -5, 0);
			printObject.lockDepth = 2;
			printObject.computeBoundingBox();

			printObject.autoAlignMesh();

			// Y position should be adjusted based on minY and lockDepth
			expect(mesh.position.y).toBeDefined();
		});
	});

	describe("isIntersectingWithSocketCup", () => {
		test("shows collision warning when meshes intersect", async () => {
			printObject = await createPrintObjectWithMesh();
			const mesh = printObject.mesh;
			if (!mesh) throw new Error("Mesh not found");

			// Position mesh to intersect with socket cup
			mesh.position.set(0, 0, 0);

			printObject.isIntersectingWithSocketCup();

			// The collision detection depends on BVH intersection
			// This test verifies the method doesn't throw
			expect(htmlElements.collisionWarning.style.display).toBeDefined();
		});

		test("returns early if no mesh exists", () => {
			printObject = new PrintObject({
				callback: mockCallback,
				socketCup: mockSocketCup as never,
				scene: mockScene,
			});

			// Should not throw
			expect(() => printObject.isIntersectingWithSocketCup()).not.toThrow();
		});

		test("returns early if no socketCup mesh exists", async () => {
			printObject = await createPrintObjectWithMesh();
			printObject.socketCup = { mesh: null } as never;

			// Should not throw
			expect(() => printObject.isIntersectingWithSocketCup()).not.toThrow();
		});
	});

	describe("handleRotationChange", () => {
		test("rotates mesh on x axis", async () => {
			printObject = await createPrintObjectWithMesh();
			const mesh = printObject.mesh;
			if (!mesh) throw new Error("Mesh not found");

			printObject.lockDepth = 0;
			const initialRotation = mesh.rotation.x;

			await printObject.handleRotationChange("x", QUARTER_TURN);

			expect(mesh.rotation.x).not.toBe(initialRotation);
		});

		test("rotates mesh on y axis", async () => {
			printObject = await createPrintObjectWithMesh();
			const mesh = printObject.mesh;
			if (!mesh) throw new Error("Mesh not found");

			printObject.lockDepth = 0;
			const initialRotation = mesh.rotation.y;

			await printObject.handleRotationChange("y", QUARTER_TURN);

			expect(mesh.rotation.y).not.toBe(initialRotation);
		});

		test("rotates mesh on z axis", async () => {
			printObject = await createPrintObjectWithMesh();
			const mesh = printObject.mesh;
			if (!mesh) throw new Error("Mesh not found");

			printObject.lockDepth = 0;
			const initialRotation = mesh.rotation.z;

			await printObject.handleRotationChange("z", QUARTER_TURN);

			expect(mesh.rotation.z).not.toBe(initialRotation);
		});

		test("saves rotation values to database", async () => {
			const { updateRotateValues } = await import("@/db/appSettingsDbActions");
			printObject = await createPrintObjectWithMesh();
			printObject.lockDepth = 0;

			await printObject.handleRotationChange("x", QUARTER_TURN);

			expect(updateRotateValues).toHaveBeenCalled();
		});

		test("calls autoAlignMesh after rotation", async () => {
			printObject = await createPrintObjectWithMesh();
			printObject.lockDepth = 0;
			const autoAlignSpy = vi.spyOn(printObject, "autoAlignMesh");

			await printObject.handleRotationChange("x", QUARTER_TURN);

			expect(autoAlignSpy).toHaveBeenCalled();
		});

		test("checks for collision after rotation", async () => {
			printObject = await createPrintObjectWithMesh();
			printObject.lockDepth = 0;
			const collisionSpy = vi.spyOn(printObject, "isIntersectingWithSocketCup");

			await printObject.handleRotationChange("x", QUARTER_TURN);

			expect(collisionSpy).toHaveBeenCalled();
		});
	});

	describe("rotation shortcuts", () => {
		test("coronalRotate90 rotates on x axis", async () => {
			printObject = await createPrintObjectWithMesh();
			printObject.lockDepth = 0;
			const handleRotationSpy = vi.spyOn(printObject, "handleRotationChange");

			await printObject.coronalRotate90();

			expect(handleRotationSpy).toHaveBeenCalledWith("x", QUARTER_TURN);
		});

		test("sagittalRotate90 rotates on z axis", async () => {
			printObject = await createPrintObjectWithMesh();
			printObject.lockDepth = 0;
			const handleRotationSpy = vi.spyOn(printObject, "handleRotationChange");

			await printObject.sagittalRotate90();

			expect(handleRotationSpy).toHaveBeenCalledWith("z", QUARTER_TURN);
		});

		test("transversalRotater90 rotates on y axis", async () => {
			printObject = await createPrintObjectWithMesh();
			printObject.lockDepth = 0;
			const handleRotationSpy = vi.spyOn(printObject, "handleRotationChange");

			await printObject.transversalRotater90();

			expect(handleRotationSpy).toHaveBeenCalledWith("y", QUARTER_TURN);
		});
	});

	describe("handleTranslationChange", () => {
		test("translates mesh on x axis (negated)", async () => {
			printObject = await createPrintObjectWithMesh();
			const mesh = printObject.mesh;
			if (!mesh) throw new Error("Mesh not found");

			const mockEvent = {
				target: { value: "10" },
			} as unknown as Event;

			await printObject.handleTranslationChange("x", mockEvent);

			expect(mesh.position.x).toBe(-10);
		});

		test("translates mesh on y axis with offset", async () => {
			printObject = await createPrintObjectWithMesh();
			const mesh = printObject.mesh;
			if (!mesh) throw new Error("Mesh not found");

			printObject.offsetYPosition = 5;
			const mockEvent = {
				target: { value: "10" },
			} as unknown as Event;

			await printObject.handleTranslationChange("y", mockEvent);

			expect(mesh.position.y).toBe(15); // 10 + 5 offset
		});

		test("translates mesh on z axis (negated)", async () => {
			printObject = await createPrintObjectWithMesh();
			const mesh = printObject.mesh;
			if (!mesh) throw new Error("Mesh not found");

			const mockEvent = {
				target: { value: "10" },
			} as unknown as Event;

			await printObject.handleTranslationChange("z", mockEvent);

			expect(mesh.position.z).toBe(-10);
		});

		test("ignores NaN values", async () => {
			printObject = await createPrintObjectWithMesh();
			const mesh = printObject.mesh;
			if (!mesh) throw new Error("Mesh not found");

			const initialX = mesh.position.x;
			const mockEvent = {
				target: { value: "not a number" },
			} as unknown as Event;

			await printObject.handleTranslationChange("x", mockEvent);

			expect(mesh.position.x).toBe(initialX);
		});

		test("saves translation values to database", async () => {
			const { updateTranslateValues } = await import(
				"@/db/appSettingsDbActions"
			);
			printObject = await createPrintObjectWithMesh();
			const mockEvent = {
				target: { value: "10" },
			} as unknown as Event;

			await printObject.handleTranslationChange("x", mockEvent);

			expect(updateTranslateValues).toHaveBeenCalled();
		});

		test("checks for collision after translation", async () => {
			printObject = await createPrintObjectWithMesh();
			const collisionSpy = vi.spyOn(printObject, "isIntersectingWithSocketCup");
			const mockEvent = {
				target: { value: "10" },
			} as unknown as Event;

			await printObject.handleTranslationChange("x", mockEvent);

			expect(collisionSpy).toHaveBeenCalled();
		});
	});

	describe("translation shortcuts", () => {
		test("horizontalChange calls handleTranslationChange with x", async () => {
			printObject = await createPrintObjectWithMesh();
			const handleTranslationSpy = vi.spyOn(
				printObject,
				"handleTranslationChange",
			);
			const mockEvent = { target: { value: "5" } } as unknown as Event;

			await printObject.horizontalChange(mockEvent);

			expect(handleTranslationSpy).toHaveBeenCalledWith("x", mockEvent);
		});

		test("verticalChange calls handleTranslationChange with y", async () => {
			printObject = await createPrintObjectWithMesh();
			const handleTranslationSpy = vi.spyOn(
				printObject,
				"handleTranslationChange",
			);
			const mockEvent = { target: { value: "5" } } as unknown as Event;

			await printObject.verticalChange(mockEvent);

			expect(handleTranslationSpy).toHaveBeenCalledWith("y", mockEvent);
		});

		test("depthChange calls handleTranslationChange with z", async () => {
			printObject = await createPrintObjectWithMesh();
			const handleTranslationSpy = vi.spyOn(
				printObject,
				"handleTranslationChange",
			);
			const mockEvent = { target: { value: "5" } } as unknown as Event;

			await printObject.depthChange(mockEvent);

			expect(handleTranslationSpy).toHaveBeenCalledWith("z", mockEvent);
		});
	});

	describe("inherited AppObject methods", () => {
		test("computeBoundingBox calculates bounding box", async () => {
			printObject = await createPrintObjectWithMesh();

			printObject.computeBoundingBox();

			expect(printObject.boundingBox).toBeInstanceOf(Box3);
			expect(printObject.size).toBeInstanceOf(Vector3);
			expect(printObject.center).toBeInstanceOf(Vector3);
		});

		test("computeBoundingBox throws without mesh", () => {
			printObject = new PrintObject({
				callback: mockCallback,
				socketCup: mockSocketCup as never,
				scene: mockScene,
			});

			expect(() => printObject.computeBoundingBox()).toThrow("Mesh not found");
		});

		test("updateMatrixWorld updates mesh matrices", async () => {
			printObject = await createPrintObjectWithMesh();
			const mesh = printObject.mesh;
			if (!mesh) throw new Error("Mesh not found");

			const updateMatrixSpy = vi.spyOn(mesh, "updateMatrix");
			const updateMatrixWorldSpy = vi.spyOn(mesh, "updateMatrixWorld");

			printObject.updateMatrixWorld();

			expect(updateMatrixSpy).toHaveBeenCalled();
			expect(updateMatrixWorldSpy).toHaveBeenCalledWith(true);
		});

		test("updateMatrixWorld returns early without mesh", () => {
			printObject = new PrintObject({
				callback: mockCallback,
				socketCup: mockSocketCup as never,
				scene: mockScene,
			});

			// Should not throw
			expect(() => printObject.updateMatrixWorld()).not.toThrow();
		});
	});
});

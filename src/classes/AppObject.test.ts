import { BoxGeometry, Mesh, MeshBasicMaterial } from "three";
import { describe, expect, test } from "vitest";
import { AppObject } from "./AppObject";

describe("AppObject", () => {
	test("initializes with null properties", () => {
		const appObject = new AppObject();

		expect(appObject.mesh).toBeNull();
		expect(appObject.boundingBox).toBeNull();
		expect(appObject.size).toBeNull();
		expect(appObject.center).toBeNull();
	});

	test("updateMatrixWorld returns early when mesh is null", () => {
		const appObject = new AppObject();

		// Should not throw
		expect(() => appObject.updateMatrixWorld()).not.toThrow();
	});

	test("computeBoundingBox throws error when mesh is null", () => {
		const appObject = new AppObject();

		expect(() => appObject.computeBoundingBox()).toThrow("Mesh not found");
	});

	test("computeBoundingBox calculates bounding box from mesh", () => {
		const appObject = new AppObject();
		const geometry = new BoxGeometry(2, 4, 6);
		const material = new MeshBasicMaterial();
		appObject.mesh = new Mesh(geometry, material);

		appObject.computeBoundingBox();

		expect(appObject.boundingBox).toBeDefined();
		expect(appObject.size).toBeDefined();
		expect(appObject.center).toBeDefined();

		// BoxGeometry centered at origin with dimensions 2x4x6
		expect(appObject.size?.x).toBeCloseTo(2);
		expect(appObject.size?.y).toBeCloseTo(4);
		expect(appObject.size?.z).toBeCloseTo(6);

		expect(appObject.center?.x).toBeCloseTo(0);
		expect(appObject.center?.y).toBeCloseTo(0);
		expect(appObject.center?.z).toBeCloseTo(0);
	});

	test("computeBoundingBox reflects mesh position", () => {
		const appObject = new AppObject();
		const geometry = new BoxGeometry(2, 2, 2);
		const material = new MeshBasicMaterial();
		appObject.mesh = new Mesh(geometry, material);
		appObject.mesh.position.set(10, 20, 30);
		appObject.mesh.updateMatrixWorld(true);

		appObject.computeBoundingBox();

		expect(appObject.center?.x).toBeCloseTo(10);
		expect(appObject.center?.y).toBeCloseTo(20);
		expect(appObject.center?.z).toBeCloseTo(30);
	});

	test("updateMatrixWorld updates mesh matrices and computes bounding box", () => {
		const appObject = new AppObject();
		const geometry = new BoxGeometry(1, 1, 1);
		const material = new MeshBasicMaterial();
		appObject.mesh = new Mesh(geometry, material);
		appObject.mesh.position.set(5, 5, 5);

		appObject.updateMatrixWorld();

		expect(appObject.boundingBox).toBeDefined();
		expect(appObject.size).toBeDefined();
		expect(appObject.center).toBeDefined();
		expect(appObject.center?.x).toBeCloseTo(5);
		expect(appObject.center?.y).toBeCloseTo(5);
		expect(appObject.center?.z).toBeCloseTo(5);
	});

	test("bounding box min and max are correct", () => {
		const appObject = new AppObject();
		const geometry = new BoxGeometry(4, 6, 8);
		const material = new MeshBasicMaterial();
		appObject.mesh = new Mesh(geometry, material);

		appObject.computeBoundingBox();

		// Box centered at origin: min = -half, max = +half
		expect(appObject.boundingBox?.min.x).toBeCloseTo(-2);
		expect(appObject.boundingBox?.min.y).toBeCloseTo(-3);
		expect(appObject.boundingBox?.min.z).toBeCloseTo(-4);
		expect(appObject.boundingBox?.max.x).toBeCloseTo(2);
		expect(appObject.boundingBox?.max.y).toBeCloseTo(3);
		expect(appObject.boundingBox?.max.z).toBeCloseTo(4);
	});
});

import {
	BoxGeometry,
	BufferAttribute,
	BufferGeometry,
	Mesh,
	MeshStandardMaterial,
} from "three";
import { describe, expect, test } from "vitest";
import { applyOffset } from "./generateOffsetWithNormal";

describe("applyOffset", () => {
	function createSimpleMesh(): Mesh {
		const geometry = new BufferGeometry();
		// Create a simple triangle
		const vertices = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
		geometry.setAttribute("position", new BufferAttribute(vertices, 3));
		geometry.computeVertexNormals();

		const material = new MeshStandardMaterial();
		return new Mesh(geometry, material);
	}

	test("returns a mesh", async () => {
		const mesh = createSimpleMesh();

		const result = await applyOffset(mesh, 0.1);

		expect(result).toBeInstanceOf(Mesh);
	});

	test("modifies the original mesh geometry", async () => {
		const mesh = createSimpleMesh();
		const originalGeometry = mesh.geometry;

		await applyOffset(mesh, 0.1);

		expect(mesh.geometry).not.toBe(originalGeometry);
	});

	test("applies positive offset to expand geometry", async () => {
		const geometry = new BoxGeometry(1, 1, 1);
		const nonIndexedGeom = geometry.toNonIndexed();
		const material = new MeshStandardMaterial();
		const mesh = new Mesh(nonIndexedGeom, material);

		mesh.geometry.computeBoundingBox();
		const boundingBox = mesh.geometry.boundingBox;
		if (!boundingBox) throw new Error("Bounding box not computed");
		const originalSize = boundingBox.max.x - boundingBox.min.x;

		await applyOffset(mesh, 0.5);

		mesh.geometry.computeBoundingBox();
		const newBoundingBox = mesh.geometry.boundingBox;
		if (!newBoundingBox) throw new Error("Bounding box not computed");
		const newSize = newBoundingBox.max.x - newBoundingBox.min.x;

		expect(newSize).toBeGreaterThan(originalSize);
	});

	test("applies negative offset to shrink geometry", async () => {
		const geometry = new BoxGeometry(2, 2, 2);
		const nonIndexedGeom = geometry.toNonIndexed();
		const material = new MeshStandardMaterial();
		const mesh = new Mesh(nonIndexedGeom, material);

		mesh.geometry.computeBoundingBox();
		const boundingBox = mesh.geometry.boundingBox;
		if (!boundingBox) throw new Error("Bounding box not computed");
		const originalSize = boundingBox.max.x - boundingBox.min.x;

		await applyOffset(mesh, -0.3);

		mesh.geometry.computeBoundingBox();
		const newBoundingBox = mesh.geometry.boundingBox;
		if (!newBoundingBox) throw new Error("Bounding box not computed");
		const newSize = newBoundingBox.max.x - newBoundingBox.min.x;

		expect(newSize).toBeLessThan(originalSize);
	});

	test("preserves vertex count after offset", async () => {
		const geometry = new BoxGeometry(1, 1, 1);
		const nonIndexedGeom = geometry.toNonIndexed();
		const material = new MeshStandardMaterial();
		const mesh = new Mesh(nonIndexedGeom, material);

		const originalCount = (
			mesh.geometry.getAttribute("position") as BufferAttribute
		).count;

		await applyOffset(mesh, 0.2);

		const newCount = (mesh.geometry.getAttribute("position") as BufferAttribute)
			.count;

		expect(newCount).toBe(originalCount);
	});

	test("creates geometry with UV coordinates after offset", async () => {
		const geometry = new BoxGeometry(1, 1, 1);
		const nonIndexedGeom = geometry.toNonIndexed();
		const material = new MeshStandardMaterial();
		const mesh = new Mesh(nonIndexedGeom, material);

		await applyOffset(mesh, 0.1);

		expect(mesh.geometry.getAttribute("uv")).toBeDefined();
	});

	test("handles zero offset", async () => {
		const geometry = new BoxGeometry(1, 1, 1);
		const nonIndexedGeom = geometry.toNonIndexed();
		const material = new MeshStandardMaterial();
		const mesh = new Mesh(nonIndexedGeom, material);

		mesh.geometry.computeBoundingBox();
		const boundingBox = mesh.geometry.boundingBox;
		if (!boundingBox) throw new Error("Bounding box not computed");
		const originalMax = boundingBox.max.clone();

		await applyOffset(mesh, 0);

		mesh.geometry.computeBoundingBox();
		const newBoundingBox = mesh.geometry.boundingBox;
		if (!newBoundingBox) throw new Error("Bounding box not computed");
		const newMax = newBoundingBox.max;

		expect(newMax.x).toBeCloseTo(originalMax.x, 5);
		expect(newMax.y).toBeCloseTo(originalMax.y, 5);
		expect(newMax.z).toBeCloseTo(originalMax.z, 5);
	});

	test("handles indexed geometry by converting to non-indexed", async () => {
		const geometry = new BoxGeometry(1, 1, 1); // BoxGeometry is indexed by default
		const material = new MeshStandardMaterial();
		const mesh = new Mesh(geometry, material);

		// Should not throw
		const result = await applyOffset(mesh, 0.1);

		expect(result).toBeInstanceOf(Mesh);
		expect(result.geometry.getAttribute("position")).toBeDefined();
	});

	test("computes bounding box after offset", async () => {
		const mesh = createSimpleMesh();

		await applyOffset(mesh, 0.1);

		expect(mesh.geometry.boundingBox).not.toBeNull();
	});

	test("computes bounding sphere after offset", async () => {
		const mesh = createSimpleMesh();

		await applyOffset(mesh, 0.1);

		expect(mesh.geometry.boundingSphere).not.toBeNull();
	});
});

import { BufferAttribute, BufferGeometry } from "three";
import { describe, expect, test } from "vitest";
import { ensureUV } from "./ensureUV";

describe("ensureUV", () => {
	test("adds UV attribute when geometry has no UVs", () => {
		const geometry = new BufferGeometry();
		const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
		geometry.setAttribute("position", new BufferAttribute(positions, 3));

		ensureUV(geometry);

		expect(geometry.attributes.uv).toBeDefined();
		expect(geometry.attributes.uv.count).toBe(3);
		expect(geometry.attributes.uv.itemSize).toBe(2);
	});

	test("sets all UV coordinates to zero", () => {
		const geometry = new BufferGeometry();
		const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
		geometry.setAttribute("position", new BufferAttribute(positions, 3));

		ensureUV(geometry);

		const uvArray = geometry.attributes.uv.array;
		for (let i = 0; i < uvArray.length; i++) {
			expect(uvArray[i]).toBe(0);
		}
	});

	test("does not overwrite existing UV attribute", () => {
		const geometry = new BufferGeometry();
		const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
		geometry.setAttribute("position", new BufferAttribute(positions, 3));

		const existingUVs = new Float32Array([0.5, 0.5, 1, 0, 0, 1]);
		geometry.setAttribute("uv", new BufferAttribute(existingUVs, 2));

		ensureUV(geometry);

		expect(geometry.attributes.uv.array).toBe(existingUVs);
	});

	test("handles geometry with many vertices", () => {
		const geometry = new BufferGeometry();
		const vertexCount = 100;
		const positions = new Float32Array(vertexCount * 3);
		geometry.setAttribute("position", new BufferAttribute(positions, 3));

		ensureUV(geometry);

		expect(geometry.attributes.uv.count).toBe(vertexCount);
		expect(geometry.attributes.uv.array.length).toBe(vertexCount * 2);
	});
});

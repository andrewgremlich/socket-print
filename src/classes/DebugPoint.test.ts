import { Vector3 } from "three";
import { describe, expect, test } from "vitest";
import { DebugPoint } from "./DebugPoint";

// We recommend installing an extension to run vitest tests.

describe("DebugPoint", () => {
	test("creates sphere geometry with expected parameters", async () => {
		const point = new Vector3(5, -3, 10);
		const debugPoint = new DebugPoint(point);

		expect(debugPoint.geometry).toBeDefined();
		expect(debugPoint.geometry.type).toBe("SphereGeometry");
		// parameters: { radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength }
		const { radius, widthSegments, heightSegments } = (
			debugPoint.geometry as any
		).parameters;
		expect(radius).toBe(1);
		expect(widthSegments).toBe(16);
		expect(heightSegments).toBe(16);
	});

	test("assigns red material", async () => {
		const debugPoint = new DebugPoint(new Vector3(0, 0, 0));
		expect(debugPoint.material).toBeDefined();
		// Color stored as Color object; .getHex() returns numeric value
		expect(debugPoint.material.color.getHex()).toBe(0xff0000);
	});

	test("mesh constructed with geometry and material", async () => {
		const point = new Vector3(1, 2, 3);
		const debugPoint = new DebugPoint(point);

		expect(debugPoint.mesh).toBeDefined();
		expect(debugPoint.mesh.geometry).toBe(debugPoint.geometry);
		expect(debugPoint.mesh.material).toBe(debugPoint.material);
	});

	test("mesh position matches provided vector", async () => {
		const point = new Vector3(7.5, -2.25, 42);
		const debugPoint = new DebugPoint(point);

		expect(debugPoint.mesh.position.x).toBe(point.x);
		expect(debugPoint.mesh.position.y).toBe(point.y);
		expect(debugPoint.mesh.position.z).toBe(point.z);
	});

	test("modifying original vector after construction does not mutate mesh position", async () => {
		const point = new Vector3(1, 1, 1);
		const debugPoint = new DebugPoint(point);
		point.set(9, 9, 9);
		expect(debugPoint.mesh.position.x).toBe(1);
		expect(debugPoint.mesh.position.y).toBe(1);
		expect(debugPoint.mesh.position.z).toBe(1);
	});
});
